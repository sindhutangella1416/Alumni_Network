import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pymongo import MongoClient
import json
from bson.objectid import ObjectId

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://(?:localhost|127\.0\.0\.1)(?::\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = MongoClient("mongodb://localhost:27017")
db = client["alumni_db"]
collection = db["users"]
messages_coll = db["messages"]

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, ws: WebSocket, email: str):
        await ws.accept()
        self.active_connections[email] = ws
        await self.broadcast({"type": "user_status", "email": email, "status": "online"})

    def disconnect(self, email: str):
        if email in self.active_connections:
            del self.active_connections[email]

    async def send_personal_message(self, message: dict, email: str):
        if email in self.active_connections:
            try:
                await self.active_connections[email].send_json(message)
            except Exception:
                pass

    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _assert_pdf(upload: UploadFile) -> None:
    name = (upload.filename or "").lower()
    if not name.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed (.pdf).")
    head = upload.file.read(4)
    upload.file.seek(0)
    if head != b"%PDF":
        raise HTTPException(status_code=400, detail="File is not a valid PDF.")


def _save_pdf(upload: UploadFile, prefix: str) -> str:
    _assert_pdf(upload)
    safe_name = f"{prefix}_{uuid.uuid4().hex}.pdf"
    dest = UPLOAD_DIR / safe_name
    with dest.open("wb") as buffer:
        shutil.copyfileobj(upload.file, buffer)
    return f"uploads/{safe_name}"


def _save_image(upload: UploadFile, prefix: str) -> str:
    ext = Path(upload.filename or "").suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
        raise HTTPException(status_code=400, detail="Only image files are allowed.")
    safe_name = f"{prefix}_{uuid.uuid4().hex}{ext if ext else '.png'}"
    dest = UPLOAD_DIR / safe_name
    with dest.open("wb") as buffer:
        shutil.copyfileobj(upload.file, buffer)
    return f"uploads/{safe_name}"


def user_public(u: Dict[str, Any]) -> Dict[str, Any]:
    if not u:
        return {}
    return {
        "id": str(u["_id"]) if u.get("_id") is not None else None,
        "name": u.get("name", ""),
        "email": u.get("email", ""),
        "role": u.get("role", ""),
        "rollNo": u.get("rollNo", ""),
        "company": u.get("company", ""),
        "position": u.get("position", ""),
        "location": u.get("location", ""),
        "resume": u.get("resume", ""),
        "idCardFile": u.get("idCardFile", ""),
        "workExperience": u.get("workExperience", ""),
        "workProofFile": u.get("workProofFile", ""),
        "details": u.get("details", ""),
        "linkedinUrl": u.get("linkedinUrl", ""),
        "githubUrl": u.get("githubUrl", ""),
        "profilePhoto": u.get("profilePhoto", ""),
    }


class ProfileUpdate(BaseModel):
    rollNo: Optional[str] = None
    role: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    location: Optional[str] = None
    resume: Optional[str] = None
    details: Optional[str] = None
    workExperience: Optional[str] = None
    linkedinUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    profilePhoto: Optional[str] = None


class ConnectBody(BaseModel):
    from_email: str
    to_email: str


class OAuthLoginBody(BaseModel):
    provider: str
    email: str
    name: str = ""


class MessageCreate(BaseModel):
    from_email: str
    to_email: str
    body: str


@app.get("/")
def home():
    return {"message": "Backend is running successfully"}


@app.post("/register")
async def register(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    roll_no: str = Form(""),
    company: str = Form(""),
    position: str = Form(""),
    location: str = Form(""),
    details: str = Form(""),
    work_experience: str = Form(""),
    linkedin_url: str = Form(""),
    github_url: str = Form(""),
    resume_file: UploadFile = File(...),
    id_card_file: Optional[UploadFile] = File(None),
    proof_file: Optional[UploadFile] = File(None),
    profile_photo: Optional[UploadFile] = File(None),
):
    if collection.find_one({"email": email}):
        return {"error": "Email already registered"}

    role_lower = role.strip().lower()
    is_student = role_lower == "student"
    is_alumni = role_lower == "alumni"
    is_educator = role_lower in ("higher educator", "educator")
    is_entrepreneur = role_lower == "entrepreneur"

    if is_student:
        if not roll_no.strip():
            raise HTTPException(status_code=400, detail="Roll number is required for students.")
        if id_card_file is None or not (id_card_file.filename or "").strip():
            raise HTTPException(
                status_code=400,
                detail="College ID card (PDF) is required for students.",
            )
    if is_alumni or is_educator:
        if id_card_file is None or not (id_card_file.filename or "").strip():
            raise HTTPException(
                status_code=400,
                detail="ID card / employment proof PDF is required for alumni and higher educators.",
            )

    if is_entrepreneur:
        if proof_file is None or not (proof_file.filename or "").strip():
            raise HTTPException(
                status_code=400,
                detail="Working proof (PDF) is required for entrepreneurs.",
            )

    resume_path = _save_pdf(resume_file, "resume")

    id_card_path = ""
    if is_student or is_alumni or is_educator:
        id_card_path = _save_pdf(id_card_file, "idcard")

    work_proof_path = ""
    if is_entrepreneur and proof_file is not None:
        work_proof_path = _save_pdf(proof_file, "workproof")
        
    profile_photo_path = ""
    if profile_photo is not None and (profile_photo.filename or "").strip():
        profile_photo_path = _save_image(profile_photo, "profile")

    doc: Dict[str, Any] = {
        "name": name.strip(),
        "email": email.strip(),
        "password": password,
        "role": role.strip(),
        "rollNo": roll_no.strip() if is_student else "",
        "company": company.strip() if (is_alumni or is_educator) else "",
        "position": position.strip() if (is_alumni or is_educator) else "",
        "location": location.strip(),
        "resume": resume_path,
        "idCardFile": id_card_path,
        "workExperience": work_experience.strip() if is_educator else "",
        "workProofFile": work_proof_path,
        "details": details.strip(),
        "linkedinUrl": linkedin_url.strip(),
        "githubUrl": github_url.strip(),
        "profilePhoto": profile_photo_path,
        "connections": [],
    }
    collection.insert_one(doc)
    return {"message": "User registered successfully"}


@app.get("/users")
def get_users():
    users: List[Dict[str, Any]] = []
    for u in collection.find({}, {"password": 0}):
        users.append(user_public(u))
    return {"users": users}


@app.get("/profile")
def get_profile(email: str):
    u = collection.find_one({"email": email}, {"password": 0})
    if not u:
        return {"error": "User not found"}
    return {"user": user_public(u)}


@app.patch("/profile")
def update_profile(email: str, body: ProfileUpdate):
    updates = {k: v for k, v in body.dict(exclude_unset=True).items() if v is not None}
    
    # Validation constraint mappings: Cannot remove rollNo if you are a student
    # But usually frontend handles display validation, we just ensure we strip strings
    # We will just apply the updates directly as a patch.
    if not updates:
        return {"error": "No fields to update"}

    result = collection.update_one({"email": email}, {"$set": updates})
    if result.matched_count == 0:
        return {"error": "User not found"}

    u = collection.find_one({"email": email}, {"password": 0})
    return {"message": "Profile updated", "user": user_public(u)}


@app.post("/connect")
def connect(body: ConnectBody):
    if not collection.find_one({"email": body.from_email}):
        return {"error": "Sender not found"}
    if not collection.find_one({"email": body.to_email}):
        return {"error": "Recipient not found"}

    collection.update_one(
        {"email": body.from_email},
        {"$addToSet": {"connections": body.to_email}},
    )
    collection.update_one(
        {"email": body.to_email},
        {"$addToSet": {"connections": body.from_email}},
    )
    return {"message": "Connected"}


@app.get("/connections")
def get_connections(email: str):
    u = collection.find_one({"email": email})
    if not u:
        return {"error": "User not found", "connections": []}

    out: List[Dict[str, Any]] = []
    for em in u.get("connections", []):
        other = collection.find_one({"email": em}, {"password": 0})
        if other:
            out.append(user_public(other))
    return {"connections": out}


@app.post("/upload-chat-media")
async def upload_chat_media(file: UploadFile = File(...)):
    ext = Path(file.filename or "").suffix
    safe_name = f"chat_{uuid.uuid4().hex}{ext if ext else '.bin'}"
    dest = UPLOAD_DIR / safe_name
    with dest.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"url": f"uploads/{safe_name}"}


@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    url = _save_image(file, "img")
    return {"url": url}


@app.websocket("/ws/{email}")
async def websocket_endpoint(websocket: WebSocket, email: str):
    await manager.connect(websocket, email)
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            
            if action == "typing":
                await manager.send_personal_message({
                    "type": "typing",
                    "from_email": email,
                    "to_email": data.get("to_email")
                }, data.get("to_email"))
            
            elif action == "read_receipt":
                msg_ids = data.get("message_ids", [])
                if msg_ids:
                    obj_ids = [ObjectId(mid) for mid in msg_ids if len(str(mid)) == 24]
                    if obj_ids:
                        messages_coll.update_many(
                            {"_id": {"$in": obj_ids}},
                            {"$set": {"status": "seen"}}
                        )
                        sender_email = data.get("sender_email")
                        if sender_email:
                            await manager.send_personal_message({
                                "type": "status_update",
                                "message_ids": msg_ids,
                                "status": "seen"
                            }, sender_email)

            elif action == "send_message":
                body = data.get("body", "").strip()
                msg_type = data.get("msg_type", "text")
                file_url = data.get("file_url", "")
                to_email = data.get("to_email")
                
                status = "delivered" if to_email in manager.active_connections else "sent"
                
                doc = {
                    "from_email": email,
                    "to_email": to_email,
                    "body": body,
                    "type": msg_type,
                    "file_url": file_url,
                    "status": status,
                    "created_at": datetime.utcnow().isoformat() + "Z",
                }
                result = messages_coll.insert_one(doc)
                doc["_id"] = str(result.inserted_id)
                
                payload = {
                    "type": "new_message",
                    "message": doc
                }
                
                if to_email in manager.active_connections:
                    await manager.send_personal_message(payload, to_email)
                
                await manager.send_personal_message(payload, email)
                
    except WebSocketDisconnect:
        manager.disconnect(email)
        await manager.broadcast({"type": "user_status", "email": email, "status": "offline"})

@app.post("/messages")
def send_message(msg: MessageCreate):
    if not msg.body.strip():
        return {"error": "Message cannot be empty"}

    doc = {
        "from_email": msg.from_email,
        "to_email": msg.to_email,
        "body": msg.body.strip(),
        "type": "text",
        "file_url": "",
        "status": "sent",
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    result = messages_coll.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return {"message": "Sent", "chat": doc}


@app.get("/messages")
def get_messages(email: str, with_email: str):
    cursor = messages_coll.find(
        {
            "$or": [
                {"from_email": email, "to_email": with_email},
                {"from_email": with_email, "to_email": email},
            ]
        }
    ).sort("created_at", 1)

    chats = []
    for m in cursor:
        chats.append(
            {
                "id": str(m["_id"]),
                "from_email": m.get("from_email", ""),
                "to_email": m.get("to_email", ""),
                "body": m.get("body", ""),
                "type": m.get("type", "text"),
                "file_url": m.get("file_url", ""),
                "status": m.get("status", "sent"),
                "created_at": m.get("created_at", ""),
            }
        )
    return {"messages": chats}


@app.post("/oauth-login")
def oauth_login(body: OAuthLoginBody):
    user = collection.find_one({"email": body.email})

    # If the user does not exist, create them
    if not user:
        doc: Dict[str, Any] = {
            "name": body.name.strip() or body.email.split("@")[0],
            "email": body.email.strip(),
            "password": "", # OAuth users don't have passwords
            "role": "Alumni", # Default role
            "rollNo": "",
            "company": "",
            "position": "",
            "location": "",
            "resume": "",
            "idCardFile": "",
            "workExperience": "",
            "workProofFile": "",
            "details": "",
            "connections": [],
            "provider": body.provider,
        }
        collection.insert_one(doc)
        user = doc
    
    return {
        "message": "Login successful",
        "user": {
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "Alumni"),
            "rollNo": user.get("rollNo", ""),
        },
    }


@app.post("/login")
def login(email: str, password: str, roll_no: str = ""):
    user = collection.find_one({"email": email})

    if not user:
        return {"error": "User not found"}

    if user["password"] != password:
        return {"error": "Invalid password"}

    if roll_no.strip():
        stored_roll = (user.get("rollNo") or "").strip()
        if not stored_roll:
            return {"error": "No roll number on file for this account. Leave roll number blank to sign in."}
        if stored_roll != roll_no.strip():
            return {"error": "Roll number does not match this account."}

    return {
        "message": "Login successful",
        "user": {
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "rollNo": user.get("rollNo", ""),
        },
    }


app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
