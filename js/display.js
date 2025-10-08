
(function() {
	var contestants = [];

	var locked = true;

	var main = document.querySelector("main");

	function addContestant(name, image) {
		var contestant = {};

		contestant.name = name
		contestant.image = !!image ? image : "./images/blank.jpg";
		contestant.score = 0;
		contestant.oldScore = 0;
		contestant.maxHR = 0;

		contestants.push(contestant);

		return contestants.length;
	}

	function createContestantEl(con, id) {
		var el = document.createElement("div");
		el.id = con.name;
		el.classList.add("contestant");

		var frameScaler = document.createElement("div");
		frameScaler.classList.add("frame-scaler");

		var frameContainer = document.createElement("div");
		frameContainer.classList.add("frame-container");
		frameContainer.style.webkitAnimationDelay = -id * 1.25 + "s";
		frameContainer.style.animationDelay = -id * 1.25 + "s";

		var fill = document.createElement("div");
		fill.classList.add("fill");
		fill.style.backgroundImage = "url(" + con.image + ")";

		var shadow = document.createElement("div");
		shadow.classList.add("shadow");

		var frame = document.createElement("img");
		frame.src = "./images/frame.png";
		frame.classList.add("frame");
		frame.removeAttribute("width");
		frame.removeAttribute("height");

		fill.appendChild(shadow);
		frameContainer.appendChild(fill);
		frameContainer.appendChild(frame);

		frameScaler.appendChild(frameContainer);

		var scoreContainer = document.createElement("div");
		scoreContainer.classList.add("score-container");

		var seal = document.createElement("img");
		seal.classList.add("seal");
		seal.src = "./images/seal.png";
		seal.removeAttribute("width");
		seal.removeAttribute("height");


		var score = document.createElement("h1");
		score.classList.add("score");
		score.innerText = con.oldScore;

		scoreContainer.appendChild(seal);
		scoreContainer.appendChild(score);

		var maxHRBox = document.createElement("div");
		maxHRBox.id = "MHR-" + con.name;
		maxHRBox.classList.add("maxHRBox");
		maxHRBox.classList.add("hidden");
		var heartImage = document.createElement("img");
		heartImage.classList.add("tinyHeart");
		heartImage.src = "./images/heart.svg";
		maxHRBox.appendChild(heartImage);
		var maxHRValue = document.createElement("div");
		maxHRValue.classList.add("maxHRValue");
		maxHRValue.innerText = con.maxHR;
		maxHRBox.appendChild(maxHRValue);

		el.appendChild(frameScaler);
		el.appendChild(scoreContainer);
		el.appendChild(maxHRBox);

		return el;
	}

	function transformContestants() {

		contestants.sort(function(first, second) {
			if (first.score < second.score) {
				return -1;
			} else if (first.score > second.score) {
				return 1;
			} else {
				return 0;
			}
		});

		
		var maxScore = contestants[contestants.length - 1].score;
		var maxCount = 1;

		for (var i = contestants.length - 1; i > 0; --i) {
			var con = contestants[i-1];
			if (con.score == maxScore) {
				++maxCount;
			}
		}

		for (var i = 0, l = contestants.length; i < l; ++i) {
			var con = contestants[i];

			con.el.style.msTransform = "translateX(" + (275 * i + 30) + "px)";
			con.el.style.transform = "translateX(" + (275 * i + 30) + "px)";

			if (con.score == maxScore) {
				if (maxCount > 2) {
					con.el.children[0].classList.remove("larger");
					con.el.children[0].classList.add("large");
				} else {
					con.el.children[0].classList.remove("large");
					con.el.children[0].classList.add("larger");
				}
			} else {
				con.el.children[0].classList.remove("large");
				con.el.children[0].classList.remove("larger");
			}
		}
	}


	function refreshContestants() {
		main.innerHTML = "";

		for (var i = contestants.length; i > 0; --i) {
			var con = contestants[i-1];

			var cEl = createContestantEl(con, i);
			con.el = cEl;
		}

		if (contestants.length > 0) transformContestants();
		
		for (var i = contestants.length; i > 0; --i) {
			var con = contestants[i-1];
			main.appendChild(con.el);
		}
	}

	function ease(t, a, b) {
		var eased = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
		return (b - a) * eased + a;
	}


	function play() {
		var start = 0;
		var loop = function(dt) {
			if (start == 0) {
				start = dt;
			}

			for (var i = 0, l = contestants.length; i < l; ++i) {
				var con = contestants[i];

				var startRemainder = con.oldScore - Math.floor(con.oldScore);
				var endRemainder = con.score - Math.floor(con.score);

				var scoreEl = con.el.querySelector(".score");

				var score = Math.round(ease(Math.min((dt - start) / 2000, 1), Math.floor(con.oldScore), Math.floor(con.score)));

				if (dt - start < 1000) {
					score += startRemainder;
				} else {
					score += endRemainder;
				}

				scoreEl.innerText = score;
			}

			if (dt - start < 2000) {
				window.requestAnimationFrame(loop);
			} else {
				for (var i = 0, l = contestants.length; i < l; ++i) {
					var con = contestants[i];
					con.oldScore = con.score;
				}
			}
		};

		window.requestAnimationFrame(loop);
		transformContestants();

	}

	refreshContestants();

	function resize(rep) {
		var w = window.innerWidth;
		var h = window.innerHeight;

		var wm = 1400 * ((contestants.length + (locked ? 0 : 0.25)) / 5);

		var m = Math.min(w / wm, h / 1080);

		main.style.msTransform = "scale(" + m + ")";
		main.style.transform = "scale(" + m + ")";

		main.style.left = (w - wm * m) / 2 + "px";
	}

	window.addEventListener("resize", resize);




	fetch('contestantinfo.json')
		.then(response => response.json())
		.then(data => {
			contestantsData = data["contestants"];
			contestantsData.forEach((contestant, index) => {
				addContestant(contestant.name, contestant.image);
			});

			refreshContestants();
			resize();

		})
		.catch(error => {
			console.error('Error:', error);
		});


	// Code for the BroadcastChannel

	const bc = new BroadcastChannel('scoreboard');

	bc.onmessage = function(evt) {
		console.log(evt.data);
		if (evt.data === 'go') {
			play();
		} else if (evt.data[0] === "S") {
			var parts = evt.data.split(",");
			var name = parts[1];
			var score = parseInt(parts[2]);

			const player = contestants.find(c => c.name === name);
			player.score = score;
		} else if (evt.data === "HRSHOW") {
			showHeartrateInterface();
		} else if (evt.data === "HRHIDE") {
			hideHeartrateInterface();
		} else if (evt.data === "HRRESET") {
			resetAllMaxHR();
		} else if (evt.data === "HIGHLIGHTCLEAR") {
			const els = document.getElementsByClassName("highlight");
			for (let i = 0; i < els.length; i++) {
				els[i].classList.remove("highlight");
			}
			
		} else if (evt.data[0] === "H") {
			// HANDLE HEARTRATE DATA
			const parts = evt.data.split(",");

			if (parts[0] == "HIGHLIGHT") {
				const parts = evt.data.split(",");
				const name = parts[1];
				const el = document.getElementById(name);
				el.classList.add("highlight");
			} else {
				const type = parts[1];
				const value = parts[2];

				if (type === "now") {
					// animateDivNumberToValue(heartrateNumberElement, value);
					heartrateNumberElement.innerText = value;
					hr = parseInt(value);
				}

				if (type === "max") {
					contestantName = parts[3];

					const player = contestants.find(c => c.name === contestantName);
					player.maxHR = value;
					const maxHRBox = document.getElementById("MHR-" + contestantName);
					maxHRBox.children[1].innerText = value;

				}
			}
		}

		
	};

	function resetAllMaxHR() {
		contestants.forEach(c => {
			c.maxHR = 0;
			const maxHRBox = document.getElementById("MHR-" + c.name);
			maxHRBox.children[1].innerText = 0;
		});
	}

	var hr = 0;

	// Code for heartrate stuff

	const backgroundElement = document.getElementById('background');
	const contestantsElement = document.getElementById('main');
	const heartIconElement = document.getElementById('heart-icon');
	const heartrateInterfaceElement = document.getElementById('HeartrateInterface');
	const heartrateNumberElement = document.getElementById('heartrate-number');

	function showHeartrateInterface() {
		console.log("showing heartrate interface");
		backgroundElement.classList.add("HRBackgroundStyle");
		hideAllWithClass("score-container");
		contestantsElement.classList.add("HRContestantsStyle");
		heartrateInterfaceElement.classList.remove("hiddenHRInterface");
		showAllWithClass("maxHRBox");

		// remove class "large" from all contestant frame elements
		const contestantFrames = document.getElementsByClassName("frame-scaler");
		for (let i = 0; i < contestantFrames.length; i++) {
			contestantFrames[i].classList.add("large");
			contestantFrames[i].classList.remove("larger");
		}
	}

	function hideHeartrateInterface() {
		console.log("hiding heartrate interface");
		backgroundElement.classList.remove("HRBackgroundStyle");
		showAllWithClass("score-container");
		contestantsElement.classList.remove("HRContestantsStyle");
		heartrateInterfaceElement.classList.add("hiddenHRInterface");
		hideAllWithClass("maxHRBox");

		transformContestants();
	}





	// silly HR animation and interface stuff

	function hideAllWithClass(className) {
		var elements = document.getElementsByClassName(className);
		for (var i = 0; i < elements.length; i++) {
			elements[i].classList.add("hidden");
		}
	}

	function showAllWithClass(className) {
		var elements = document.getElementsByClassName(className);
		for (var i = 0; i < elements.length; i++) {
			elements[i].classList.remove("hidden");
		}
	}


	function singleHeartBeat() {
		heartIconElement.classList.add("heartBeat");
		setTimeout(() => {
			heartIconElement.classList.remove("heartBeat");
		}, 100);
	}

	const numberAnimationTime = 500;

	function animateDivNumberToValue(div, value, tick=-1) {
		var current = parseInt(div.innerText);
	
		if (tick == -1) {
			diff = Math.abs(current - value);
			tick = numberAnimationTime / diff;
		}
			
	
	
		if (current == value) {
			return;
		}
	
		if (current > value) {
			div.innerText = current - 1;
		} else {
			div.innerText = current + 1;
		}
	
		setTimeout(function() {
			animateDivNumberToValue(div, value, tick);
		}, tick);
	}



	// start of heartbeat graphic stuff
	function makeHeartBeat() {
		if (hr == 0) {
			setTimeout(() => {
				makeHeartBeat();
			}, 2000);
			return;
		}
		singleHeartBeat();
		setTimeout(() => {
			makeHeartBeat();
		}, 60000 / hr);
	}

	makeHeartBeat();
	// End of heartrate graphic stuff

})();