const initializeScanner = async () => {
	const codeReader = new ZXing.BrowserMultiFormatReader();
	const videoElement = document.getElementById('video');
	const overlayElement = document.getElementById('overlay');
	const resultElement = document.getElementById('result');
	const startButton = document.getElementById('startButton');
	const stopButton = document.getElementById('stopButton');
	const cameraSelect = document.getElementById('cameraSelect');
	const overlayContext = overlayElement.getContext('2d');
	let isCameraRunning = false;
	let selectedDeviceId = null;

	// Define the capture region (x, y, width, height)
	const captureRegion = { x: 200, y: 150, width: 400, height: 300 };

	const drawCaptureRegion = () => {
		overlayContext.strokeStyle = 'green';
		overlayContext.lineWidth = 2;
		overlayContext.strokeRect(captureRegion.x, captureRegion.y, captureRegion.width, captureRegion.height);
	};

	const toggleCameraButtons = (isRunning) => {
		startButton.disabled = isRunning;
		stopButton.disabled = !isRunning;
		cameraSelect.disabled = isRunning;
		videoElement.style.display = isRunning ? 'block' : 'none';
		overlayElement.style.display = isRunning ? 'block' : 'none';
	};

	const isBarcodeWithinCaptureRegion = (points) => {
		return points.every(point =>
			point.x >= captureRegion.x &&
			point.x <= captureRegion.x + captureRegion.width &&
			point.y >= captureRegion.y &&
			point.y <= captureRegion.y + captureRegion.height
		);
	};

	const initializeCameraOptions = async () => {
		const devices = await codeReader.listVideoInputDevices();
		cameraSelect.innerHTML = '';
		devices.forEach(device => {
			const option = document.createElement('option');
			option.value = device.deviceId;
			option.textContent = device.label;
			cameraSelect.appendChild(option);
		});
		if (devices.length > 0) {
			selectedDeviceId = devices[0].deviceId;
		}
	};

	const startCamera = () => {
		codeReader.decodeFromVideoDevice(selectedDeviceId, videoElement, (result, error) => {
			overlayContext.clearRect(0, 0, overlayElement.width, overlayElement.height);
			drawCaptureRegion();

			if (result) {
				resultElement.textContent = result.text;
				console.log(result);

				const videoWidth = videoElement.videoWidth;
				const videoHeight = videoElement.videoHeight;
				const canvasWidth = overlayElement.width;
				const canvasHeight = overlayElement.height;
				const widthRatio = canvasWidth / videoWidth;
				const heightRatio = canvasHeight / videoHeight;

				const points = result.resultPoints.map(point => ({
					x: point.x * widthRatio,
					y: point.y * heightRatio
				}));

				const xMin = Math.min(...points.map(p => p.x));
				const xMax = Math.max(...points.map(p => p.x));
				const yMin = Math.min(...points.map(p => p.y));
				const yMax = Math.max(...points.map(p => p.y));

				drawBoundingBox(xMin, xMax, yMin, yMax);

				if (isBarcodeWithinCaptureRegion(points)) {
					resultElement.textContent = `Success: ${result.text}`;
				} else {
					resultElement.textContent = 'Barcode detected but out of capture region';
				}
			}

			if (error && !(error instanceof ZXing.NotFoundException)) {
				resultElement.textContent = `Error: ${error.message}`;
				console.error(error);
			}
		}).then(() => {
			isCameraRunning = true;
			toggleCameraButtons(isCameraRunning);
		}).catch(err => {
			resultElement.textContent = `Camera error: ${err.message}`;
			console.error(err);
		});
	};

	const stopCamera = () => {
		if (isCameraRunning) {
			codeReader.reset();
			resultElement.textContent = '';
			toggleCameraButtons(false);
			overlayContext.clearRect(0, 0, overlayElement.width, overlayElement.height);
			isCameraRunning = false;
		}
	};

	const drawBoundingBox = (xMin, xMax, yMin, yMax) => {
		overlayContext.beginPath();
		overlayContext.moveTo(xMin, yMin);
		overlayContext.lineTo(xMax, yMin);
		overlayContext.lineTo(xMax, yMax);
		overlayContext.lineTo(xMin, yMax);
		overlayContext.closePath();
		overlayContext.strokeStyle = 'red';
		overlayContext.lineWidth = 2;
		overlayContext.stroke();
	};

	startButton.addEventListener('click', startCamera);
	stopButton.addEventListener('click', stopCamera);

	cameraSelect.addEventListener('change', (event) => {
		selectedDeviceId = event.target.value;
	});

	await initializeCameraOptions();
};

document.addEventListener('DOMContentLoaded', initializeScanner);