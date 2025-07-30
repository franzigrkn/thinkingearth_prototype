# Production-ready Flask configuration
import os
from flask import Flask, render_template, jsonify, send_from_directory

app = Flask(__name__)

# Production configuration
app.config['ENV'] = 'production'
app.config['DEBUG'] = False

# Configuration for available datapoints and variables
DATAPOINTS = {
    '2018-01-01T18:00:00': '2018-01-01 18:00:00',
    '2018-02-01T18:00:00': '2018-02-01 18:00:00',
    '2018-03-01T18:00:00': '2018-03-01 18:00:00',
    '2018-04-01T18:00:00': '2018-04-01 18:00:00',
    '2018-05-01T18:00:00': '2018-05-01 18:00:00',
    '2018-06-01T18:00:00': '2018-06-01 18:00:00',
    '2018-07-01T18:00:00': '2018-07-01 18:00:00',
    '2018-08-01T18:00:00': '2018-08-01 18:00:00',
    '2018-09-01T18:00:00': '2018-09-01 18:00:00',
    '2018-10-01T18:00:00': '2018-10-01 18:00:00',
    '2018-11-01T18:00:00': '2018-11-01 18:00:00',
    '2018-12-01T18:00:00': '2018-12-01 18:00:00'
}

VARIABLES = {
    'windspeed': 'Wind Speed',
    'temperature': 'Temperature',
    'u500': 'Zonal Wind U (500hPa)'
}

EPOCHS = {
    '5': '5 epochs',
    '10': '10 epochs',
    '20': '20 epochs',
    '40': '40 epochs',
    '60': '60 epochs',
    '80': '80 epochs',
    '100': '100 epochs',
    '150': '150 epochs',
    '200': '200 epochs'
}

@app.route('/')
def index():
    """Main page with the interactive visualization interface"""
    return render_template('index.html', 
                         datapoints=DATAPOINTS, 
                         variables=VARIABLES,
                         epochs=EPOCHS)

@app.route('/about')
def about():
    """About page with project information"""
    return render_template('about.html')

@app.route('/api/image/<datapoint>/<variable>/<epoch>')
def get_prediction_image(datapoint, variable, epoch):
    """API endpoint to serve prediction images based on datapoint, variable, and epoch"""
    if (datapoint not in DATAPOINTS or variable not in VARIABLES or 
        epoch not in EPOCHS):
        return jsonify({'error': 'Invalid parameters'}), 400
    
    # Try different image formats with new naming convention
    for ext in ['png', 'jpg', 'jpeg', 'svg', 'gif']:
        image_filename = f"{datapoint}_{variable}_{epoch}ep.{ext}"
        image_path = os.path.join('static', 'images', 'predictions', image_filename)
        
        if os.path.exists(image_path):
            return send_from_directory('static/images/predictions', image_filename)
    
    # Fallback to simpler naming convention (without epoch)
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

@app.route('/api/epochs')
def get_epochs():
    """API endpoint to get available epochs"""
    return jsonify(EPOCHS)

if __name__ == '__main__':
    # Get port from environment variable (for deployment platforms)
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
