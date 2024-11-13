from app import app, db
from models import User, Chat, Character  # Import all the models you need to initialize

def create_database():
    with app.app_context():
        db.create_all()  # Create all tables based on the models
        print("Database initialized successfully!")

if __name__ == "__main__":
    create_database()
