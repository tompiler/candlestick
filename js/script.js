function drawChart() {

	d3.csv("UKX_5Mins_20180709_20180716.csv").then(function(prices) {
		
		const months = {0 : 'Jan', 1 : 'Feb', 2 : 'Mar', 3 : 'Apr', 4 : 'May', 5 : 'Jun', 6 : 'Jul', 7 : 'Aug', 8 : 'Sep', 9 : 'Oct', 10 : 'Nov', 11 : 'Dec'}
		
		console.log(prices)

		var dateFormat = d3.timeParse("%Y-%m-%d %H:%M");
		for (var i = 0; i < prices.length; i++) {
			
			prices[i]['Date'] = dateFormat(prices[i]['Date'])
		}

		const margin = {top: 15, right: 65, bottom: 235, left: 50},
			  margin2 = {top: 680, right: 65, bottom: 80, left: 50},
			  w = 1190 - margin.left - margin.right,
			  h = 820 - margin.top - margin.bottom,
			  h2 = 820 - margin2.top - margin2.bottom;

		var svg = d3.select("#container")
						.attr("width", w + margin.left + margin.right)
						.attr("height", h + margin.top + margin.bottom)
		
		var focus = svg.append("g")
					   .attr("transform", "translate(" +margin.left+ "," +margin.top+ ")");

		var context = svg.append("g")
						 .attr("transform", "translate(" +margin2.left+ "," +margin2.top+ ")");

		var leftHandle = 0,
			rightHandle = 1140;
		
		var currentExtent = [0,0]

		var brush = d3.brushX()
					  .extent([[leftHandle, 0], [rightHandle, h2]])
					  .on("brush start", updateCurrentExtent)
					  .on("brush end", brushed);
		
		let dates = _.map(prices, 'Date');
		
		var xmin = d3.min(prices.map(r => r.Date.getTime()));
		var xmax = d3.max(prices.map(r => r.Date.getTime()));
		var xScale = d3.scaleLinear().domain([-1, dates.length])
						.range([0, w])
		
		var xScale2 = d3.scaleLinear()
						.domain([-1, dates.length])
						.range([0, w])

		var xDateScale = d3.scaleQuantize().domain([0, dates.length]).range(dates)
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
		
		var xAxis2 = d3.axisBottom()
					   .scale(xScale2)
					   .tickFormat(function(d) {
							d = dates[d]
							hours = d.getHours()
							minutes = (d.getMinutes()<10?'0':'') + d.getMinutes() 
							amPM = hours < 13 ? 'am' : 'pm'
							return hours + ':' + minutes + amPM + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear()
						});

		focus.append("rect")
					.attr("id","rect")
					.attr("width", w)
					.attr("height", h)
					.style("fill", "none")
					.style("pointer-events", "all")
					.attr("clip-path", "url(#clip)")
		
		var gX = focus.append("g")
					.attr("class", "axis x-axis") //Assign "axis" class
					.attr("transform", "translate(0," + h + ")")
					.call(xAxis)
		
		gX.selectAll(".tick text")
		  .call(wrap, xBand.bandwidth())

		var gX2 = context.append("g")
			   .attr("class", "axis axis--x")
			   .attr("transform", "translate(0," + h2 + ")")
			   .call(xAxis2)

		gX2.selectAll(".tick text")
			.call(wrap, xBand.bandwidth())

		context.append("g")
			   .attr("class", "brush")
			   .on("click", brushed)
			   .call(brush)
			   //.call(brush.move, [new Date()])

		var ymin = d3.min(prices.map(r => r.Low));
		var ymax = d3.max(prices.map(r => r.High));
		var yScale = d3.scaleLinear().domain([ymin, ymax]).range([h, 0]).nice();
		var yAxis = d3.axisLeft()
					  .scale(yScale)
		
		var gY = focus.append("g")
					.attr("class", "axis y-axis")
					.call(yAxis);
		
		var chartBody = focus.append("g")
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
		
		focus.append("defs")
		   .append("clipPath")
		   .attr("id", "clip")
		   .append("rect")
		   .attr("width", w)
		   .attr("height", h)
		

		function updateCurrentExtent() {
			currentExtent = d3.brushSelection(this);
		}

		function brushed() {
			if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
			var s = d3.event.selection;
			
			//console.log(x(new Date(2001,0,1))); // 1 year in terms of x
		   
			var p = currentExtent,
				xYear = xScale2(new Date(2001,0,1)),
				left,
				right;
			
			if (d3.event.selection && s[1] - s[0] >= xYear) {
			  if (p[0] == s[0] && p[1] < s[1]) { // case where right handle is extended
				if (s[1] >= width) {
				  left = width - xYear
				  right = width
				  s = [left, right];
				}
				else {
				  left = s[1] - xYear/2
				  right = s[1] + xYear/2
				  s = [left, right];
				}
			  }
			  else if (p[1] == s[1] && p[0] > s[0]) { // case where left handle is extended
				if (s[0] <= 0) {
				  s = [0, xYear];
				}
				else {
				  s = [s[0] - xYear/2, s[0] + xYear/2]
				}
			  }
			}
			
			if (!d3.event.selection){ // if no selection took place and the brush was just clicked
			  var mouse = d3.mouse(this)[0];
			  if (mouse < xYear/2) {
				s = [0,xYear];
			  } else if (mouse + xYear/2 > width) {
				s = [width-xYear, width];
			  }
			  else {
			  s = [d3.mouse(this)[0]-xYear/2, d3.mouse(this)[0]+xYear/2];
			  }
			}
			
			//xScale.domain(s.map(xScale2.invert, xScale2));
			//focus.select(".line").attr("d", line);
			focus.select(".axis--x").call(xAxis);
			svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
													   .scale(w / (s[1] - s[0]))
													   .translate(-s[0], 0));
		}
	  
		
		const extent = [[0, 0], [w, h]];
		
		var resizeTimer;
		var zoom = d3.zoom()
		  .scaleExtent([1, 100])
		  .translateExtent(extent)
		  .extent(extent)
		  .on("zoom", zoomed)
		  .on('zoom.end', zoomend);
		
		focus.call(zoom)

		function zoomed() {
			
			var t = d3.event.transform;
			let xScaleZ = t.rescaleX(xScale);
			
			let hideTicksWithoutLabel = function() {
				d3.selectAll('.xAxis .tick text').each(function(d){
					if(this.innerHTML === '') {
					this.parentNode.style.display = 'none'
					}
				})
			}

			gX.call(
				d3.axisBottom(xScaleZ).tickFormat((d, e, target) => {
						if (d >= 0 && d <= dates.length-1) {
					d = dates[d]
					hours = d.getHours()
					minutes = (d.getMinutes()<10?'0':'') + d.getMinutes() 
					amPM = hours < 13 ? 'am' : 'pm'
					return hours + ':' + minutes + amPM + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear()
					}
				})
			)

			candles.attr("x", (d, i) => xScaleZ(i) - (xBand.bandwidth()*t.k)/2)
				   .attr("width", xBand.bandwidth()*t.k);
			stems.attr("x1", (d, i) => xScaleZ(i) - xBand.bandwidth()/2 + xBand.bandwidth()*0.5);
			stems.attr("x2", (d, i) => xScaleZ(i) - xBand.bandwidth()/2 + xBand.bandwidth()*0.5);

			hideTicksWithoutLabel();

			gX.selectAll(".tick text")
			.call(wrap, xBand.bandwidth())

		}
		
		function zoomend() {
			var t = d3.event.transform;
			let xScaleZ = t.rescaleX(xScale);
			//console.log(t);
			clearTimeout(resizeTimer)
			resizeTimer = setTimeout(function() {

			var xmin = new Date(xDateScale(Math.floor(xScaleZ.domain()[0])))
				xmax = new Date(xDateScale(Math.floor(xScaleZ.domain()[1])))
				filtered = _.filter(prices, d => ((d.Date >= xmin) && (d.Date <= xmax)))
				minP = +d3.min(filtered, d => d.Low)
				maxP = +d3.max(filtered, d => d.High)
				buffer = Math.floor((maxP - minP) * 0.1)

			yScale.domain([minP - buffer, maxP + buffer])
			candles.transition()
				   .duration(800)
				   .attr("y", (d) => yScale(Math.max(d.Open, d.Close)))
				   .attr("height",  d => (d.Open === d.Close) ? 1 : yScale(Math.min(d.Open, d.Close))-yScale(Math.max(d.Open, d.Close)));
				   
			stems.transition().duration(800)
				 .attr("y1", (d) => yScale(d.High))
				 .attr("y2", (d) => yScale(d.Low))
			
			gY.transition().duration(800).call(d3.axisLeft().scale(yScale));

			}, 500)
			
		}
	});
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