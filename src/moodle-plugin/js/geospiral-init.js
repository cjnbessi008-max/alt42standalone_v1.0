/**
 * Geo Spiral Block Initialization
 */

function initGeoSpiral(config) {
  console.log('Initializing Geo Spiral with config:', config);

  // Initialize virtual phone container
  const container = document.getElementById(config.containerid);
  if (!container) {
    console.error('Container not found:', config.containerid);
    return;
  }

  // Load frontend app in iframe
  const iframe = document.createElement('iframe');
  iframe.src = config.apiurl.replace('/api.php', '/frontend/index.html') +
    '?userid=' + config.userid +
    '&courseid=' + config.courseid;
  iframe.width = '100%';
  iframe.height = '700px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '12px';
  iframe.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.2)';

  container.appendChild(iframe);

  // Listen for messages from iframe
  window.addEventListener('message', function(event) {
    if (event.data.type === 'geospiral_interaction') {
      console.log('Interaction logged:', event.data);
      // Could send analytics to Moodle here
    }
  });
}

// Make function available globally
window.initGeoSpiral = initGeoSpiral;
