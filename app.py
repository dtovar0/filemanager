from factory import create_app
from models import db
import os

# Create the application instance
app = create_app(os.environ.get('FLASK_ENV', 'dev'))

# Expose db for compatibility with scripts that do 'from app import db'
# Though 'from models import db' is now preferred
with app.app_context():
    # Only create tables if they don't exist
    try:
        db.create_all()
    except Exception as e:
        app.logger.error(f"Error initializing DB tables: {str(e)}")

if __name__ == '__main__':
    # Ensure standard port for local development
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=app.debug, host='0.0.0.0', port=port)
