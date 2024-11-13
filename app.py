from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for
import requests
import io
from TTS.api import TTS
import json
import os
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from database import db
from datetime import datetime
from model_manager import ModelManager
from flask import Flask, request, jsonify
import threading
import logging
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import os
import sys
print(sys.version)

CHARACTERS_FILE = 'characters.json'

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'your_default_secret_key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///sherlock_chatsv2.db')
RUNPOD_API_URL = os.getenv('RUNPOD_API_URL')
RUNPOD_API_KEY = os.getenv('RUNPOD_API_KEY')
db.init_app(app)
# Import models after db is defined
from models import User, Chat, Character



model_manager = ModelManager(
    os.getenv('RUNPOD_API_URL'),
    os.getenv('RUNPOD_API_KEY')
)

loading_thread = None



login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'



# LM Studio API endpoint
url = "https://openrouter.ai/api/v1/chat/completions"

# File to store all characters
CHARACTERS_FILE = 'characters.json'

@app.route('/')
def index():
    return render_template('index.html')

# Initialize TTS (do this outside of the route to avoid reloading the model for each request)
tts = TTS(model_name="tts_models/en/vctk/vits", progress_bar=False, gpu=False)



@app.route('/get_response', methods=['POST'])
def get_response():
    data = request.json
    if data.get('use_local_model', False):
        print(f"Current User Authenticated: {current_user.is_authenticated}")  # Debugging line
        if not current_user.is_authenticated:
            return jsonify({
                "error": "You must be logged in to use the fine-tuned model.",
                "message": "Using the fine-tuned model requires login because it incurs hosting costs."
            }), 403
        
        try:
            response = model_manager.inference(data['messages'])
            return jsonify({"choices": [{"message": {"content": response}}]})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        # OpenRouter system remains intact
        api_key = request.headers.get('Authorization').split('Bearer ')[1]  # Extract the API key from the headers
        headers = {"Authorization": f"Bearer {api_key}"}

        try:
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()  # Raise an exception for bad status codes
            print("OpenRouter response:", response.json())
            # Return the API response to the client
            return jsonify(response.json())

        except requests.RequestException as e:
            print(f"OpenRouter error: {str(e)}")
            error_message = f"An error occurred while communicating with the API: {str(e)}"
            return jsonify({"error": error_message}), 500

    
    
    
    
    
    
    
    
    
@app.route('/text_to_speech', methods=['POST'])
def text_to_speech():
    data = request.json
    text = data['text']
    
    try:
        # Generate audio
        audio_bytes = io.BytesIO()
        tts.tts_to_file(text=text, file_path=audio_bytes, speaker="p267", speed=0.1, pitch=0.5)  # Use the first available speaker
        audio_bytes.seek(0)
        
        return send_file(audio_bytes, mimetype="audio/wav")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/save_character', methods=['POST'])
@app.route('/save_character', methods=['POST'])
@login_required
def save_character():
    try:
        new_character = request.json
        character = Character(
            user_id=current_user.id,
            name=new_character['name'],
            description=new_character.get('description', ''),
            relationship=new_character.get('relationship', ''),
            traits=json.dumps(new_character.get('traits', [])),  # Store traits as JSON string
            speaking_style=new_character.get('speakingStyle', ''),
            sherlock_approach=new_character.get('sherlockApproach', '')
        )
        db.session.add(character)
        db.session.commit()
        return jsonify({"message": "Character saved successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def load_characters():
    """Load default characters from the JSON file."""
    if os.path.exists(CHARACTERS_FILE):
        with open(CHARACTERS_FILE, 'r') as f:
            return json.load(f)
    return []  # Return an empty list if the file doesn't exist


@app.route('/get_characters', methods=['GET'])
def get_characters():
    try:
        # Load default characters from JSON
        default_characters = load_characters()
        
        if current_user.is_authenticated:
            # Load user-specific characters from the database
            user_characters = Character.query.filter_by(user_id=current_user.id).all()
            user_characters_list = [
                {
                    'name': char.name,
                    'description': char.description,
                    'relationship': char.relationship,
                    'traits': json.loads(char.traits),
                    'speakingStyle': char.speaking_style,
                    'sherlockApproach': char.sherlock_approach
                }
                for char in user_characters
            ]

            # Combine default and user-specific characters for logged-in users
            return jsonify(default_characters + user_characters_list)
        
        # For non-logged-in users, only return default characters
        return jsonify(default_characters)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


    



@app.route('/api/chats', methods=['GET'])
@login_required
def get_chats():
    chats = Chat.query.filter_by(user_id=current_user.id).order_by(Chat.created_at.desc()).all()
    return jsonify([{
        "id": chat.id,
        "title": chat.title,
        "preview": chat.preview,
        "created_at": chat.created_at.isoformat(),
        "character": chat.character
    } for chat in chats])

@app.route('/api/chats', methods=['POST'])
@app.route('/api/chats/<int:chat_id>', methods=['PUT'])
@login_required
def save_or_update_chat(chat_id=None):
    try:
        data = request.json
        if not all(key in data for key in ['title', 'preview', 'full_content', 'character']):
            return jsonify({"error": "Missing required fields"}), 400

        if chat_id:
            chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first()
            if not chat:
                return jsonify({"error": "Chat not found or unauthorized"}), 404
            chat.title = data['title']
            chat.preview = data['preview']
            chat.full_content = data['full_content']
            chat.character = data['character']
        else:
            chat = Chat(
                user_id=current_user.id,
                title=data['title'],
                preview=data['preview'],
                full_content=data['full_content'],
                character=data['character']
            )
            db.session.add(chat)

        db.session.commit()
        return jsonify({"message": "Chat saved/updated successfully", "id": chat.id}), 200 if chat_id else 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/chats/<int:chat_id>', methods=['GET'])
@login_required
def get_chat(chat_id):
    chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first_or_404()
    return jsonify({
        "id": chat.id,
        "title": chat.title,
        "full_content": chat.full_content,
        "character" : chat.character,
        "created_at": chat.created_at.isoformat()
    })

@app.route('/api/chats/<int:chat_id>', methods=['DELETE'])
@login_required
def delete_chat(chat_id):
    try:
        chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first_or_404()
        db.session.delete(chat)
        db.session.commit()
        return jsonify({"message": "Chat deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/load_local_model', methods=['POST'])
def load_local_model():
    if model_manager.status == 'not_loaded':
        threading.Thread(target=model_manager.load_model).start()
        return jsonify({"message": "Model loading started"}), 202
    return jsonify({"message": f"Model is already {model_manager.status}"}), 200

@app.route('/check_model_status', methods=['GET'])
def check_model_status():
    return jsonify({'status': model_manager.get_status()}), 200




@app.route('/unload_local_model', methods=['POST'])
def unload_local_model():
    try:
        model_manager.unload_model()
        return jsonify({"message": "Model unloaded successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/local_model_inference', methods=['POST'])
@login_required
def local_model_inference():
    if model_manager.status != 'ready':
        return jsonify({"error": "Model is not ready"}), 400
    
    data = request.json
    messages = data.get('messages')
    temperature = data.get('temperature', 0.7)  # Default value for temperature
    max_tokens = data.get('max_tokens', 300)
    if not messages:
        return jsonify({"error": "No messages provided"}), 400
    
    try:
        formatted_prompt = model_manager.format_prompt(messages)
        response = model_manager.inference(messages,temperature, max_tokens)
        return jsonify({
            "response": response,
            "formatted_prompt": formatted_prompt
        }), 200
    except Exception as e:
        app.logger.error(f"Error in local_model_inference: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        if not username or not password:
            return jsonify({"success": False, "message": "Username and password are required"}), 400

        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return jsonify({"success": True, "message": "Login successful"}), 200
        else:
            return jsonify({"success": False, "message": "Invalid username or password"}), 401

    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        email = request.form.get('email')

        if not username or not password or not email:
            return jsonify({"success": False, "message": "All fields are required"}), 400

        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            return jsonify({"success": False, "message": "Username or email already exists"}), 400

        new_user = User(username=username, email=email, password_hash=generate_password_hash(password))
        try:
            db.session.add(new_user)
            db.session.commit()
            login_user(new_user)
            return jsonify({"success": True, "message": "Registration successful"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"success": False, "message": "An error occurred. Please try again."}), 500

    return render_template('register.html')




@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/api/user')
def user_status():
    if current_user.is_authenticated:
        return jsonify({
            "logged_in": True,
            "username": current_user.username
        })
    else:
        return jsonify({
            "logged_in": False
        })





if __name__ == '__main__':
    app.run(debug=True)