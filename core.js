var header, errorMessage, technicalMessage;
var navPrevious, navNext;
var classList, holidayList, tableContainer;

var meta, planJSON;
var config = {
	schoolName: "Example",
	plansDir: "plans/",
	showSubstitutions: false,
	debug: true
};

Date.prototype.addDays = function(days) {
	var dat = new Date(this.valueOf());
	dat.setDate(dat.getDate() + days);
	return dat;
}

Object.prototype.isEmpty = function() {
	return Object.keys(this).length === 0;
}

window.addEventListener("DOMContentLoaded", function(e) {
	header = document.getElementById("site-header");
	errorMessage = document.getElementsByClassName("message")[0];
	technicalMessage = document.getElementsByClassName("technical-message")[0];
	
	navPrevious = document.getElementById("nav-previous");
	navNext = document.getElementById("nav-next");
	
	classList = document.getElementById("class-list");
	holidayList = document.getElementById("holiday-list");
	tableContainer = document.getElementById("table-container");

	console.log(config);
	if (!config.showSubstitutions) {
		debug("no subst");
		tableContainer.className = "noSubst";
	}

	document.body.classList.remove("noscript");
	document.body.classList.add("loading");
}, false);

window.addEventListener("load", function(e) {
	moment.locale("de");
	
	navPrevious.addEventListener("click", navigateToPreviousWeek, false);
	navNext.addEventListener("click", navigateToNextWeek, false);
	
	loadInfo(function() {
		var hash = window.location.hash.substring(1).toLowerCase();
		processHash(hash);
	});
}, false);

window.addEventListener("hashchange", function(e) {
	var hash = window.location.hash.substring(1).toLowerCase();
	processHash(hash);
}, false);

function pad(num, size) {
	var s = num+"";
	while (s.length < size) s = "0" + s;
	return s;
}

var debug = function() {
	if (config.debug) {
		console.log.apply(console, arguments);
	}
}

var currentWeek = 0;
function navigateToPreviousWeek() {
	debug("Old week: " + currentWeek);
	document.body.classList.remove("page" + currentWeek);

	currentWeek = Math.max(0, currentWeek-1);
	debug("New week: " + currentWeek);
	
	document.body.classList.add("page" + currentWeek);
}
function navigateToNextWeek() {
	debug("Old week: " + currentWeek);
	document.body.classList.remove("page" + currentWeek);

	currentWeek = Math.min(currentWeek+1, 2);
	debug("New week: " + currentWeek);
	
	document.body.classList.add("page" + currentWeek);
}
function navigateToWeek(week) {
	debug("Directly navigating to week " + week);
	document.body.classList.remove("page" + currentWeek);

	currentWeek = week;
	
	document.body.classList.add("page" + currentWeek);
}

window.onerror = error;
function error(message, source, lineno, colno, error) {
	debug(message, source, lineno, colno, error);
	document.body.className = "error";
	if (typeof source !== "undefined") {
		var sourceParts = source.split("/");
		technicalMessage.innerHTML = sourceParts[sourceParts.length - 1] + "(" + lineno + ", " + colno +  "): " + message;
	} else {
		technicalMessage.innerHTML = message;
	}
	technicalMessage.classList.add("active");
	header.innerHTML = "";
	/* This navigates the page into a dead end, requiring a reload. */
}

function manualError(message) {
	document.body.className = "error";
	errorMessage.innerHTML = message;
	header.innerHTML = "";
	/* This navigates the page into a dead end, requiring a reload. */
}

function processHash(hash) {
	debug("Hash: " + (hash == "" ? "(empty)" : hash));
	
	switch(hash) {
		case "":
			debug("Displaying the menu");
			fillInfo();
			document.body.className = hash;
			header.innerHTML = config.schoolName;
			break;
		
		case "holidays":
			debug("Displaying holidays");
			fillInfo();
			document.body.className = hash;
			header.innerHTML = "Ferien";
			break;
			
		default:
			debug("Probably a class ID: " + hash);
			document.body.className = "page0";
			tableContainer.innerHTML = "";

			var hashInt = parseInt(hash);

			if(typeof meta !== "undefined") {
				var classIndex = meta.classes.ids.indexOf(hashInt);
				if (classIndex > -1) {
					header.innerHTML = meta.classes.names[classIndex];
				} else {
					manualError(`Die Klasse mit der ID ${hashInt} konnte nicht gefunden werden.`);
					break;
				}
			} else {
				debug("meta isn't defined yet");
			}

			try {
				localStorage.setItem("lastViewed", hashInt);
			} catch(e) {
				debug("localStorage.setItem: " + e);
			}

			loadPlan(hash);

			window.scrollTo(0, 0);

			break;
	}
}

function loadInfo(completion) {
	if(typeof meta !== "undefined")
		return;
	
	var oReq = new XMLHttpRequest();
	oReq.addEventListener("readystatechange", function(e) {
		var srcElement = e.srcElement || e.target;
		if(srcElement.readyState == 4) {
			if(srcElement.status == 200) {
				meta = JSON.parse(srcElement.responseText);
				debug("meta.json loaded");
				debug(meta);
				
				var m = moment(meta.lastUpdatedISO8601);
				var lastUpdateStr = m.fromNow();
				if (lastUpdateStr == "Invalid date") {
					lastUpdateStr = meta.lastUpdated;
				}
				document.getElementsByTagName("footer")[0].innerHTML = lastUpdateStr;
				
				completion();
			} else {
				var responseURLParts = srcElement.responseURL.split("/");
				manualError(`Konnte ${responseURLParts[responseURLParts.length - 1]} nicht laden`);
			}
		}
	}, false);
	oReq.onerror = error;
	oReq.open("get", config.plansDir + "meta.json");
	oReq.send();
}

function fillInfo() {
	debug("fillInfo");

	var lastViewed = localStorage.getItem("lastViewed");
	if (lastViewed === null)
		lastViewed = -1;

	classList.innerHTML = "";
	for (var i = 0; i < meta.classes.ids.length; i++) {
		var classLink = document.createElement("a");
		classLink.href = "#" + meta.classes.ids[i];
		classLink.innerHTML = meta.classes.names[i];

		if (meta.classes.ids[i] == lastViewed)
			classLink.className = "last-viewed";
		
		classList.appendChild(classLink);
	}

	if (config.debug) {
		var classLink = document.createElement("a");
		classLink.href = "#" + 9001;
		classLink.innerHTML = "error";	
		classList.appendChild(classLink);
	}
	
	holidayList.innerHTML = "";
	for (var i = 0; i < meta.holidays.length; i++) {
	    var holiday = meta.holidays[i];
	    
	    var holidayStart = moment(holiday.startDateISO8601);
	    var holidayEnd = moment(holiday.endDateISO8601);
	    
	    if(holidayEnd.isBefore())
	    	continue;
	    
		var holidayDiv = document.createElement("div");
		var holidayDivText = holiday.startDate;
		if (holiday.startDateUntis != holiday.endDateUntis) {
		    holidayDivText += " - " + holiday.endDate;
		}
		holidayDivText += ": " + holiday.name;
		holidayDiv.innerHTML = holidayDivText;
		
	    holidayList.appendChild(holidayDiv);
	}
}

function loadPlan(classID) {
	var oReq = new XMLHttpRequest();
	oReq.addEventListener("readystatechange", function(e) {
		var srcElement = e.srcElement || e.target;
		if(srcElement.readyState == 4) {
			if(srcElement.status == 200) {
				planJSON = JSON.parse(srcElement.responseText);
				debug("Plans loaded");
				document.body.classList.remove("loading");
				fillPlan();
			} else {
				var responseURLParts = srcElement.responseURL.split("/");
				manualError(`Konnte ${responseURLParts[responseURLParts.length - 1]} nicht laden`);
			}
		}
	}, false);
	oReq.onerror = error;
	oReq.open("get", config.plansDir + classID + ".json");
	oReq.send();
	
	document.body.classList.add("loading");

	var classIndex = meta.classes.ids.indexOf(parseInt(classID));
	header.innerHTML = meta.classes.names[classIndex];
}

function fillPlan() {
	debug("fillPlan", planJSON);

	var lang = "de";

	var optionsLongWeekday = { weekday: "long" };
	var optionsLongDate = { year: "numeric", month: "2-digit", day: "2-digit" };
	var optionsShortWeekday = { weekday: "short" };
	var optionsShortDate = { month: "2-digit", day: "2-digit" };

	var templateLC = document.querySelector("template#lesson-container");
	var templateTU = document.querySelector("template#timeunit");

	var tcontainer = document.getElementById("table-container");
	var todayDate = new Date();

	var startDate = new Date(planJSON.firstDay.iso8601);
	for (var w = 0; w < planJSON.weeks.length; w++) {
		var week = planJSON.weeks[w];

		var week_el = document.createElement("div");
		week_el.classList.add("week");
		
		var days_el = document.createElement("div");
		days_el.classList.add("days");

		var weekLength = week.length;
		for (var d = 0; d < weekLength; d++) {
			var day = week[d];

			var dayDate = startDate.addDays(w*7 + d);

			if (typeof day === "undefined")
				continue;

			if (day.isEmpty())
				continue;

			var dayElement = document.createElement("div");
			dayElement.classList.add("day");

			// check if this day is today
			if(w == 0 && d == todayDate.getDay() - 1)
				dayElement.classList.add("today");

			var shortDaySpan = document.createElement("span");
			var shortDateSpan = document.createElement("span");
			shortDaySpan.className = "short";
			shortDateSpan.className = "short";
			shortDaySpan.innerHTML = dayDate.toLocaleDateString(lang, optionsShortWeekday);
			shortDateSpan.innerHTML = dayDate.toLocaleDateString(lang, optionsShortDate);

			var longDaySpan = document.createElement("span");
			var longDateSpan = document.createElement("span");
			longDaySpan.className = "long";
			longDateSpan.className = "long";
			longDaySpan.innerHTML = dayDate.toLocaleDateString(lang, optionsLongWeekday);
			longDateSpan.innerHTML = dayDate.toLocaleDateString(lang, optionsLongDate);

			var day_header = document.createElement("div");
			day_header.classList.add("header");
			
			day_header.appendChild(shortDaySpan);
			day_header.appendChild(shortDateSpan);

			day_header.appendChild(longDaySpan);
			day_header.appendChild(longDateSpan);
	
			dayElement.appendChild(day_header);

			var dayKeys = Object.keys(day);
			debug(dayKeys);

			if ("holiday" in day) {
				// This is a holiday, only insert $holidayname element
				dayElement.classList.add("holiday");

				var holiday = day["holiday"];

				var timeElement = document.createElement("div");
				timeElement.classList.add("timeunit", "holiday");

				var holidayNameSpan = document.createElement("span");
				holidayNameSpan.classList.add("name");
				holidayNameSpan.innerHTML = holiday["name"];
				
				timeElement.appendChild(holidayNameSpan);

				dayElement.appendChild(timeElement);
			} else if (day.isEmpty()) {
				// This is an "empty" day
				dayElement.classList.add("empty");
			} else if (dayKeys.includes("0000")) {
				// Special case that's documented nowhere
				// Thanks for nothing, Untis devs

				debug("All-day event");

				var startTimeUnit = document.createElement("div");
				startTimeUnit.classList.add("timeunit", "time");
				startTimeUnit.innerHTML = "00:00";

				var lessonContainer = document.importNode(templateLC.content, true);
				lessonContainer.querySelector(".subject").innerHTML = "Ganztägiges";
				lessonContainer.querySelector(".room").innerHTML = "Event";

				var startTimeElement = lessonContainer.querySelector(".startTime");
				var endTimeElement = lessonContainer.querySelector(".endTime");
				startTimeElement.innerHTML = "00:00";
				endTimeElement.innerHTML = "23:59";

				var timeElement = document.importNode(templateTU.content, true);
				timeElement.querySelector(".timeunit").classList.add("lesson");
				timeElement.querySelector(".timeunit").appendChild(lessonContainer);

				var endTimeUnit = document.createElement("div");
				endTimeUnit.classList.add("timeunit", "time");
				endTimeUnit.innerHTML = "23:59";

				dayElement.appendChild(startTimeUnit);
				dayElement.appendChild(timeElement);
				dayElement.appendChild(endTimeUnit);
			} else {
				// This is a normal school day, insert regular plan
				var firstLessonIndex = Math.min.apply(Math, dayKeys);
				var lastLessonIndex = Math.max.apply(Math, dayKeys);
				var firstLessonKey = firstLessonIndex.toString().padStart(4, "0");
				var lastLessonKey = lastLessonIndex.toString().padStart(4, "0");

				var firstLessonFound = false;
				var timeHeaderAdded = false;
				for (var t = 0; t < meta.timegrid[d].length; t++) {
					var timeunit = meta.timegrid[d][t];
					if (timeunit.startTimeUntis > lastLessonIndex)
						continue;

					var lessons = day[timeunit.startTimeUntis];

					var timeElement = document.importNode(templateTU.content, true);
					if(typeof lessons !== "undefined") {
						firstLessonFound = true;
						timeElement.querySelector(".timeunit").classList.add("lesson");

						dayElement.dataset.num = Math.max(dayElement.dataset.num || 0, lessons.length);
						
						for (var n = 0; n < lessons.length; n++) {
							var lessonContainer = document.importNode(templateLC.content, true);

							var lesson = lessons[n];

							if (typeof lesson.code !== "undefined" && lesson.code != "") {
								lessonContainer.querySelector(".lesson-container").classList.add(lesson.code);
							}
							
							lessonContainer.querySelector(".subject").innerHTML = lesson.subject;
							lessonContainer.querySelector(".room").innerHTML = lesson.room;

							var teacherElement = lessonContainer.querySelector(".teacher");
							var startTimeElement = lessonContainer.querySelector(".startTime");
							var endTimeElement = lessonContainer.querySelector(".endTime");

							if (teacherElement != null)
								teacherElement.innerHTML = "TEA";

							if (startTimeElement != null)
								startTimeElement.innerHTML = lesson.startTimeReadable;

							if (endTimeElement != null)
								endTimeElement.innerHTML = lesson.endTimeReadable;

							// timeElement.querySelector(".timeunit").insertBefore(lessonContainer, timeElement.querySelector(".flip-box"));
							timeElement.querySelector(".timeunit").appendChild(lessonContainer);
						}
					} else {
						timeElement.querySelector(".timeunit").classList.add("free");
						timeElement.querySelector(".flip-box").remove();
					}
					
					if(firstLessonFound && !timeHeaderAdded) {
						var startTimeUnit = document.createElement("div");
						startTimeUnit.classList.add("timeunit", "time");
						startTimeUnit.innerHTML = day[firstLessonIndex][0].startTimeReadable;
						dayElement.appendChild(startTimeUnit);
						timeHeaderAdded = true;
					}
					
					dayElement.appendChild(timeElement);
				}
				
				var endTimeUnit = document.createElement("div");
				endTimeUnit.classList.add("timeunit", "time");
				endTimeUnit.innerHTML = day[lastLessonKey][0].endTimeReadable;
				dayElement.appendChild(endTimeUnit);
			}
			
			days_el.appendChild(dayElement);
		}

		week_el.appendChild(days_el);

		var substHeader = document.createElement("div");
		substHeader.classList.add("substitution", "header");
		substHeader.innerHTML = "Vertretungen";
		week_el.appendChild(substHeader);

		var weekStart = moment().startOf("week").subtract(1, "days").add(w, "weeks");
		var weekEnd = moment().startOf("week").add(5, "days").add(w, "weeks");

		var weekSubstitutions = null;
		if ("substitutions" in planJSON) {
			weekSubstitutions = planJSON.substitutions.filter(function(s) {
				var lessonMoment = moment(s.date, "YYYYMMDD");

				var isBetween = lessonMoment.isBetween(weekStart, weekEnd);
				var isBefore = lessonMoment.isBefore(moment(todayDate), "day");
				return isBetween && !isBefore;
			}).sort(function(a, b) {
				return parseInt(a.date) - parseInt(b.date) || parseInt(a.time) - parseInt(b.time);
			});
		}

		if (weekSubstitutions === null || weekSubstitutions.length == 0) {
			var substElement = document.createElement("div");
			substElement.classList.add("substitution");
			var substSpan = document.createElement("span");

			if ("substitutionDenied" in planJSON) {
				substSpan.innerHTML = "Zugriff auf Vertretungen von Schule verweigert";
			} else {
				substSpan.innerHTML = "Keine Vertretungen für diese Woche";
			}

			substElement.appendChild(substSpan);
			week_el.appendChild(substElement);
		} else {
			var dateToCompare = "";
			for (var s = 0; s < weekSubstitutions.length; s++) {
				var substitution = weekSubstitutions[s];
				var substitutionMoment = moment(substitution.date + " " + pad(substitution.time, 4), "YYYYMMDD HHmm");

				if (substitution.date != dateToCompare) {
					dateToCompare = substitution.date;

					var weekdayName = substitutionMoment.format("dddd");

					var substHeaderElement = document.createElement("div");
					substHeaderElement.classList.add("substitution", "header", "weekday");

					substHeaderElement.innerHTML = weekdayName;
					week_el.appendChild(substHeaderElement);
				}

				var substElement = document.createElement("div");
				substElement.classList.add("substitution");
				if (substitutionMoment.isBefore())
					substElement.classList.add("past");

				var substSpan = document.createElement("span");

				var room = substitution.room.newRoom || "???";
				var oldRoom = substitution.room.oldRoom || "???";

				var lessonNumber = meta.timegrid[moment(substitution.date, "YYYYMMDD").weekday()].findIndex(function(x) { return x.startTimeUntis == substitution.time }) + 1;
				var substText = lessonNumber + ". <span class=\"long\">Stunde</span><span class=\"short\">Std.</span>: ";
				switch (substitution.type) {
					case "subst":
						substText += "Vertretung in " + substitution.subject + " in " + room;
						if ("oldTeacher" in substitution.teacher) {
							if (substitution.teacher.newTeacher in meta.teachers) {
								substText += " mit " + meta.teachers[substitution.teacher.newTeacher];
							} else {
								substText += " mit " + substitution.teacher.newTeacher;
							}
						}
						break;
					case "rmchg":
						substText += "Raumänderung in " + substitution.subject + " von " + oldRoom + " nach " + room;
						break;
					case "cancel":
					case "free":
						substText += "Ausfall von " + substitution.subject + " in " + room;
						break;
					case "add":
						substText += "Einschub von " + substitution.subject + " in " + room;
						break;
					case "stxt":
						substText += "Vertretung in " + substitution.subject;
						if ("text" in substitution)
							substText += " (" + substitution.text + ")";
						break;
					default:
						substText += "Unbekannt (" + substitution.type + ", " + substitution.readableTime + ", " + substitution.subject + ")";
				}

				substSpan.innerHTML = substText;
				substElement.appendChild(substSpan);
				week_el.appendChild(substElement);
			}
		}
		
		tcontainer.appendChild(week_el);
	}

	if (todayDate.getDay() == 6 || todayDate.getDay() == 0) {
		debug("It's the weekend. Displaying the next week.");
		navigateToWeek(1);
	}
}
