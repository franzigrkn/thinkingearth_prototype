# Production-ready Flask configuration
import os
from flask import Flask, render_template, jsonify, send_from_directory

app = Flask(__name__)

# Production configuration
app.config['ENV'] = 'production'
app.config['DEBUG'] = False

# Configuration for available datapoints and variables
DATAPOINTS = {
    'datapoint_1': 'Location A',
    'datapoint_2': 'Location B', 
    'datapoint_3': 'Location C',
    'datapoint_4': 'Location D'
}

VARIABLES = {
    'temperature': 'Temperature',
    'precipitation': 'Precipitation',
    'humidity': 'Humidity'
}

LEAD_TIMES = {
    '6': '6 hours',
    '12': '12 hours',
    '18': '18 hours'
}

EPOCHS = {
    '10': '10 epochs',
    '20': '20 epochs',
    '30': '30 epochs',
    '40': '40 epochs'
}

# ...existing routes...
@app.route('/')
def index():
    """Main page with the interactive visualization interface"""
    return render_template('index.html', 
                         datapoints=DATAPOINTS, 
                         variables=VARIABLES,
                         lead_times=LEAD_TIMES,
                         epochs=EPOCHS)

@app.route('/api/image/<datapoint>/<variable>/<lead_time>/<epoch>')
def get_prediction_image(datapoint, variable, lead_time, epoch):
    """API endpoint to serve prediction images based on datapoint, variable, lead_time, and epoch"""
    if (datapoint not in DATAPOINTS or variable not in VARIABLES or 
        lead_time not in LEAD_TIMES or epoch not in EPOCHS):
        return jsonify({'error': 'Invalid parameters'}), 400
    
    # Try different image formats with new naming convention
    for ext in ['png', 'jpg', 'jpeg', 'svg', 'gif']:
        image_filename = f"{datapoint}_{variable}_{lead_time}h_{epoch}ep.{ext}"
        image_path = os.path.join('static', 'images', 'predictions', image_filename)
        
        if os.path.exists(image_path):
            return send_from_directory('static/images/predictions', image_filename)
    
    # Fallback to simpler naming convention (without lead_time and epoch)
    for ext in ['png', 'jpg', 'jpeg', 'svg', 'gif']:
        image_filename = f"{datapoint}_{variable}.{ext}"
        image_path = os.path.join('static', 'images', 'predictions', image_filename)
        
        if os.path.exists(image_path):
            return send_from_directory('static/images/predictions', image_filename)
    
    # Return placeholder image if prediction image doesn't exist
    for ext in ['svg', 'png', 'jpg']:
        placeholder_filename = f"placeholder.{ext}"
        placeholder_path = os.path.join('static', 'images', placeholder_filename)
        if os.path.exists(placeholder_path):
            return send_from_directory('static/images', placeholder_filename)
    
    return jsonify({'error': 'Image not found'}), 404

@app.route('/api/datapoints')
def get_datapoints():
    """API endpoint to get available datapoints"""
    return jsonify(DATAPOINTS)

@app.route('/api/variables')
def get_variables():
    """API endpoint to get available variables"""
    return jsonify(VARIABLES)

@app.route('/api/lead-times')
def get_lead_times():
    """API endpoint to get available lead times"""
    return jsonify(LEAD_TIMES)

@app.route('/api/epochs')
def get_epochs():
    """API endpoint to get available epochs"""
    return jsonify(EPOCHS)

if __name__ == '__main__':
    # Get port from environment variable (for deployment platforms)
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
