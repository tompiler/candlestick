function drawChart() {

	d3.csv("UKX_5Mins_20180709_20180716.csv").then(function(prices) {
		
		const months = {0 : 'Jan', 1 : 'Feb', 2 : 'Mar', 3 : 'Apr', 4 : 'May', 5 : 'Jun', 6 : 'Jul', 7 : 'Aug', 8 : 'Sep', 9 : 'Oct', 10 : 'Nov', 11 : 'Dec'}

		var dateFormat = d3.timeParse("%Y-%m-%d %H:%M");
		for (var i = 0; i < prices.length; i++) {
			
			prices[i]['Date'] = dateFormat(prices[i]['Date'])
		}

		const margin = {top: 15, right: 65, bottom: 205, left: 50},
		w = 1190 - margin.left - margin.right,
		h = 770 - margin.top - margin.bottom;

		var svg = d3.select("#container")
						.attr("width", w + margin.left + margin.right)
						.attr("height", h + margin.top + margin.bottom)
						.append("g")
						.attr("transform", "translate(" +margin.left+ "," +margin.top+ ")");

		let dates = _.map(prices, 'Date');
		
		var xmin = d3.min(prices.map(r => r.Date.getTime()));
		var xmax = d3.max(prices.map(r => r.Date.getTime()));
		var xScale = d3.scaleLinear().domain([-1, dates.length])
						.range([0, w])
		let xBand = d3.scaleBand().domain(d3.range(-1, dates.length)).range([0, w]).padding(0.3)
		var xAxis = d3.axisBottom()
					  			.scale(xScale)
					    		.tickFormat(function(d) {
									  d = dates[d]
										hours = d.getHours()
										minutes = (d.getMinutes()<10?'0':'') + d.getMinutes() 
										amPM = hours < 13 ? 'am' : 'pm'
										return hours + ':' + minutes + amPM + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear()
									});
		
		svg.append("rect")
					.attr("id","rect")
					.attr("width", w)
					.attr("height", h)
					.style("fill", "none")
					.style("pointer-events", "all")
					.attr("clip-path", "url(#clip)")
		
		var gX = svg.append("g")
					.attr("class", "axis x-axis") //Assign "axis" class
					.attr("transform", "translate(0," + h + ")")
					.call(xAxis)
		
		gX.selectAll(".tick text")
		  .call(wrap, xBand.bandwidth())

		var ymin = d3.min(prices.map(r => r.Low));
		var ymax = d3.max(prices.map(r => r.High));
		var yScale = d3.scaleLinear().domain([ymin, ymax]).range([h, 0]).nice();
		var yAxis = d3.axisLeft()
					  .scale(yScale)
		
		var gY = svg.append("g")
					.attr("class", "axis y-axis")
					.call(yAxis);
		
		var chartBody = svg.append("g")
					.attr("class", "chartBody")
					.attr("clip-path", "url(#clip)");
		
		// draw rectangles
		let candles = chartBody.selectAll(".candle")
		   .data(prices)
		   .enter()
		   .append("rect")
		   .attr('x', (d, i) => xScale(i) - xBand.bandwidth())
		   .attr("class", "candle")
		   .attr('y', d => yScale(Math.max(d.Open, d.Close)))
		   .attr('width', xBand.bandwidth())
		   .attr('height', d => (d.Open === d.Close) ? 1 : yScale(Math.min(d.Open, d.Close))-yScale(Math.max(d.Open, d.Close)))
		   .attr("fill", d => (d.Open === d.Close) ? "silver" : (d.Open > d.Close) ? "red" : "green")
		
		// draw high and low
		let stems = chartBody.selectAll("g.line")
		   .data(prices)
		   .enter()
		   .append("line")
		   .attr("class", "stem")
		   .attr("x1", (d, i) => xScale(i) - xBand.bandwidth()/2)
		   .attr("x2", (d, i) => xScale(i) - xBand.bandwidth()/2)
		   .attr("y1", d => yScale(d.High))
		   .attr("y2", d => yScale(d.Low))
		   .attr("stroke", d => (d.Open === d.Close) ? "white" : (d.Open > d.Close) ? "red" : "green");
		
		svg.append("defs")
		.append("clipPath")
			.attr("id", "clip")
		.append("rect")
			.attr("width", w)
			.attr("height", h)
		
		const extent = [[0, 0], [w, h]];
		
		var zoom = d3.zoom()
			.scaleExtent([1, 8])
		  .translateExtent(extent)
			.extent(extent)
			.on("zoom", zoomed);
			
		svg.call(zoom)

		currentQueue = Queue({'label' : "X", 'tx' : d3.zoomIdentity, 'ty' : d3.zoomIdentity})
		currentQueue = Queue({'label' : "Y", 'tx' : d3.zoomIdentity, 'ty' : d3.zoomIdentity})
		console.log(currentQueue)

		function zoomed() {
			if (d3.event.transform.k < 1) {
				d3.event.transform.k = 1
				return
			}
			
			var t = d3.event.transform;
			
			let hideTicksWithoutLabel = function() {
				d3.selectAll('.xAxis .tick text').each(function(d){
					if(this.innerHTML === '') {
					this.parentNode.style.display = 'none'
					}
				})
			}
			
			// If the shift key is not pressed
			if (!d3.event.sourceEvent.shiftKey) {
				currentQueue = Queue({'label' : "X", 'tx' : t})
				console.log(currentQueue[0].label, currentQueue[1].label, currentQueue[0].label === currentQueue[1].label)
				console.log(currentQueue)
				if (currentQueue[0].label !== currentQueue[1].label) {
					console.log("Shift Up")
					t = window.queueAr[0].tx
				}
				gX.call(
					d3.axisBottom(t.rescaleX(xScale)).tickFormat((d, e, target) => {
							if (d >= 0 && d <= dates.length-1) {
						d = dates[d]
						
						hours = d.getHours()
						minutes = (d.getMinutes()<10?'0':'') + d.getMinutes() 
						amPM = hours < 13 ? 'am' : 'pm'
						return hours + ':' + minutes + amPM + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear()
						}
					})
				)

				candles.attr("x", (d, i) => t.rescaleX(xScale)(i) - (xBand.bandwidth()*t.k)/2)
								.attr("width", xBand.bandwidth()*t.k);
				stems.attr("x1", (d, i) => t.rescaleX(xScale)(i) - xBand.bandwidth()/2 + xBand.bandwidth()*0.5);
				stems.attr("x2", (d, i) => t.rescaleX(xScale)(i) - xBand.bandwidth()/2 + xBand.bandwidth()*0.5);

				hideTicksWithoutLabel();

				gX.selectAll(".tick text")
				.call(wrap, xBand.bandwidth())
			} else { // if the shift key is pressed
				//currentQueue = Queue()
				//console.log(t.y - window.queueAr[1].ty)
				currentQueue = Queue({'label' : "Y", 'ty' : t})
				console.log(currentQueue[0].label, currentQueue[1].label)
				console.log(currentQueue)
				if (currentQueue[0].label !== currentQueue[1].label) {
					console.log("Shift Down")
					console.log(t, window.queueAr[0].ty)
					t = window.queueAr[0].ty
				}
				window.queueAr[1].ty.y = (window.queueAr[1].ty.y - window.queueAr[0].ty.y)
				candles.attr("y", (d) => t.rescaleY(yScale)(Math.max(d.Open, d.Close)))
								.attr("height",  d => (d.Open === d.Close) ? 1 : t.rescaleY(yScale)(Math.min(d.Open, d.Close))-t.rescaleY(yScale)(Math.max(d.Open, d.Close)));
				stems.attr("y1", (d) => t.rescaleY(yScale)(d.High));
				stems.attr("y2", (d) => t.rescaleY(yScale)(d.Low));
				t.rescaleY(yScale).domain([ymin, ymax]).range([h, 0]);
				gY.call(yAxis.scale(t.rescaleY(yScale)));
				

			};

		}
	});
}

function Queue(item) {
	if (!arguments.length) {
		return window.queueAr
	}
	//console.log(window.queueAr)
	if (!item.hasOwnProperty('tx')) {
		item["tx"] = window.queueAr[0].tx
	}
	if (!item.hasOwnProperty('ty')) {
		item["ty"] = window.queueAr[0].ty
	}
	if (window.queueAr === undefined) {
		window.queueAr = [item]
	} else {
		window.queueAr.push(item)
		if (window.queueAr.length > 2) {
			window.queueAr.shift()
		}
	}
	return window.queueAr
}

function wrap(text, width) {
	text.each(function() {
	  var text = d3.select(this),
		  words = text.text().split(/\s+/).reverse(),
		  word,
		  line = [],
		  lineNumber = 0,
		  lineHeight = 1.1, // ems
		  y = text.attr("y"),
		  dy = parseFloat(text.attr("dy")),
		  tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
	  while (word = words.pop()) {
		line.push(word);
		tspan.text(line.join(" "));
		if (tspan.node().getComputedTextLength() > width) {
		  line.pop();
		  tspan.text(line.join(" "));
		  line = [word];
		  tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
		}
	  }
	});
}

drawChart();