const initializeScanner = () => {
	const codeReader = new ZXing.BrowserMultiFormatReader();
	const videoElement = document.getElementById('video');
	const overlayElement = document.getElementById('overlay');
	const resultElement = document.getElementById('result');
	const startButton = document.getElementById('startButton');
	const stopButton = document.getElementById('stopButton');

	const overlayContext = overlayElement.getContext('2d');
	let isCameraRunning = false;

	const toggleCameraButtons = (isRunning) => {
		startButton.disabled = isRunning;
		stopButton.disabled = !isRunning;
		videoElement.style.display = isRunning ? 'block' : 'none';
		overlayElement.style.display = isRunning ? 'block' : 'none';
	};

	const startCamera = () => {
		codeReader.decodeFromVideoDevice(null, videoElement, (result, error) => {
			overlayContext.clearRect(0, 0, overlayElement.width, overlayElement.height);

			if (result) {
				resultElement.textContent = result.text;
				console.log(result);

				const videoWidth = videoElement.videoWidth;
				const videoHeight = videoElement.videoHeight;
				const canvasWidth = overlayElement.width;
				const canvasHeight = overlayElement.height;
				const widthRatio = canvasWidth / videoWidth;
				const heightRatio = canvasHeight / videoHeight;

				const points = result.resultPoints;
				if (points.length >= 2) {
					// Log points for debugging
					console.log('Barcode Points:', points);
					const scaledPoints = points.map(point => ({
						x: point.x * widthRatio,
						y: point.y * heightRatio
					}));

					// Draw the outline
					const xMin = Math.min(...scaledPoints.map(p => p.x));
					const xMax = Math.max(...scaledPoints.map(p => p.x));
					const yMin = Math.min(...scaledPoints.map(p => p.y));
					const yMax = Math.max(...scaledPoints.map(p => p.y));

					overlayContext.beginPath();
					overlayContext.moveTo(xMin, yMin);
					overlayContext.lineTo(xMax, yMin);
					overlayContext.lineTo(xMax, yMax);
					overlayContext.lineTo(xMin, yMax);
					overlayContext.closePath();
					overlayContext.lineWidth = 2;
					overlayContext.strokeStyle = 'red';
					overlayContext.stroke();
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

	startButton.addEventListener('click', startCamera);
	stopButton.addEventListener('click', stopCamera);
};

document.addEventListener('DOMContentLoaded', initializeScanner);