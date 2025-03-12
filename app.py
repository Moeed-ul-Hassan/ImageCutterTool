import os
import logging
import requests
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
import base64

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")

# Set up logging
logger = logging.getLogger(__name__)

# Configure upload settings
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB limit

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/remove-background', methods=['POST'])
def remove_background():
    # Check if image was uploaded
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    
    # Check if the file is empty
    if file.filename == '':
        return jsonify({'error': 'No image selected'}), 400
    
    # Check file type
    if not allowed_file(file.filename):
        return jsonify({'error': f'Unsupported file format. Please upload {", ".join(ALLOWED_EXTENSIONS)}.'}), 400
    
    try:
        # Get API key from environment variables
        api_key = os.environ.get('BACKGROUND_REMOVAL_API_KEY')
        if not api_key:
            return jsonify({'error': 'API key not configured on the server'}), 500

        # Read the file content
        image_data = file.read()
        
        # Select appropriate background removal API (using Remove.bg as an example)
        # You might need to adjust this based on the actual API service you're using
        response = requests.post(
            'https://api.remove.bg/v1.0/removebg',
            files={'image_file': image_data},
            data={'size': 'auto'},
            headers={'X-Api-Key': api_key},
        )
        
        # Check if API call was successful
        if response.status_code == 200:
            # Convert the processed image to base64 for easy display
            processed_image = base64.b64encode(response.content).decode('utf-8')
            return jsonify({
                'success': True,
                'processed_image': processed_image
            })
        else:
            error_message = f"API Error: {response.status_code}"
            try:
                error_detail = response.json().get('errors', [{}])[0].get('title', 'Unknown error')
                error_message = f"API Error: {error_detail}"
            except:
                pass
            
            logger.error(f"Background removal API error: {error_message}")
            return jsonify({'error': error_message}), 500
            
    except Exception as e:
        logger.exception("Error processing image")
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
