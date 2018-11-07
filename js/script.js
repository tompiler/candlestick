function drawChart() {

	d3.csv("UKX_5Mins_20180709_20180716.csv").then(function (prices) {

		// Define month names
		const months = { 0: 'Jan', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4: 'May', 5: 'Jun', 6: 'Jul', 7: 'Aug', 8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dec' }

		//console.log(prices)
		// define dateFormat function
		var dateFormat = d3.timeParse("%Y-%m-%d %H:%M");

		// Parse dates
		for (var i = 0; i < prices.length; i++) {
			prices[i]['Date'] = dateFormat(prices[i]['Date'])
		}

		// define margin bounds for focus & context regions
		const margin = { top: 15, right: 65, bottom: 235, left: 50 },
			margin2 = { top: 680, right: 65, bottom: 80, left: 50 },
			w = 1190 - margin.left - margin.right,
			h = 820 - margin.top - margin.bottom,
			h2 = 820 - margin2.top - margin2.bottom;

		// define svg dimensions
		var svg = d3.select("#container")
					.attr("width", w + margin.left + margin.right)
					.attr("height", h + margin.top + margin.bottom);

		// define chart dimensions
		var focus = svg.append("g")
					   .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// define brush dimensions
		var context = svg.append("g")
						 .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

		// get array of dates in data
		let dates = _.map(prices, 'Date');

		// define min and max dates in data
		var xmin = d3.min(prices.map(r => r.Date.getTime()));
		var xmax = d3.max(prices.map(r => r.Date.getTime()));

		// define linear x-axis scale
		var xScale = d3.scaleLinear().domain([-1, dates.length]).range([0, w]);

		// define quantize date scale with continuous domain and discrete range
		var xDateScale = d3.scaleQuantize().domain([0, dates.length]).range(dates);

		// define banded x-axis scale to account for discontinuities in financial time series
		let xBand = d3.scaleBand().domain(d3.range(-1, dates.length)).range([0, w]).padding(0.3);

		// define x-axis, apply scale and tick formatting
		var xAxis = d3.axisBottom()
					  .scale(xScale)
					  .tickFormat((d) => dateFormatter(d));
		
		// add clip path to focus - needed to make chart draggable
		focus.append("rect")
			 .attr("id", "rect")
			 .attr("width", w)
			 .attr("height", h)
			 .style("fill", "none")
			 .style("pointer-events", "all")
			 .attr("clip-path", "url(#clip)");
		
		// Add x-axis to chart
		var gX = focus.append("g")
					  .attr("class", "axis x-axis") //Assign "axis" class
					  .attr("transform", "translate(0," + h + ")")
					  .call(xAxis);
		
		// wrap x-axis labels
		gX.selectAll(".tick text")
		  .call(wrap, xBand.bandwidth());
		
		// add x-axis to brush
		var gX2 = context.append("g")
						 .attr("class", "axis axis--x")			
						 .attr("transform", "translate(0," + h2 + ")")
						 .call(xAxis);
		
		// add brush x-axis labels
		gX2.selectAll(".tick text")
		   .call(wrap, xBand.bandwidth());
		
		// define min and max prices in data
		var ymin = d3.min(prices.map(r => r.Low));
		var ymax = d3.max(prices.map(r => r.High));

		// define linear y-axis scale
		var yScale = d3.scaleLinear().domain([ymin, ymax]).range([h, 0]).nice();

		// define y-axis and apply scale
		var yAxis = d3.axisLeft().scale(yScale);
		
		// Add y-axis to chart
		var gY = focus.append("g")
			.attr("class", "axis y-axis")
			.call(yAxis);
		
		// add clip-path to chart
		var chartBody = focus.append("g")
			.attr("class", "chartBody")
			.style("pointer-events", "all")
			.attr("clip-path", "url(#clip)");

		// draw candles
		let candles = chartBody.selectAll(".candle")
			.data(prices)
			.enter()
			.append("rect")
			.attr('x', (d, i) => xScale(i) - xBand.bandwidth())
			.attr("class", "candle")
			.attr('y', d => yScale(Math.max(d.Open, d.Close)))
			.attr('width', xBand.bandwidth())
			.attr('height', d => (d.Open === d.Close) ? 1 : yScale(Math.min(d.Open, d.Close)) - yScale(Math.max(d.Open, d.Close)))
			.attr("fill", d => (d.Open === d.Close) ? "silver" : (d.Open > d.Close) ? "red" : "green");

		// draw high and low in candles
		let stems = chartBody.selectAll("g.line")
			.data(prices)
			.enter()
			.append("line")
			.attr("class", "stem")
			.attr("x1", (d, i) => xScale(i) - xBand.bandwidth() / 2)
			.attr("x2", (d, i) => xScale(i) - xBand.bandwidth() / 2)
			.attr("y1", d => yScale(d.High))
			.attr("y2", d => yScale(d.Low))
			.attr("stroke", d => (d.Open === d.Close) ? "white" : (d.Open > d.Close) ? "red" : "green");
		
		// append clipPath to focus
		focus.append("defs")
			.append("clipPath")
			.attr("id", "clip")
			.append("rect")
			.attr("width", w)
			.attr("height", h);
		
		// define brush and bind ebvent listeners
		var currentExtent;
		var brush = d3.brushX()
			.extent([[0, 0], [w, h2]])
			.on("brush end", brushed);
		
		// define zoom and bind event listeners
		const extent = [[0, 0], [w, h]];
		var resizeTimer;
		var zoom = d3.zoom()
			.scaleExtent([1, 100])
			.translateExtent(extent)
			.extent(extent)
			.on("zoom", zoomed)
			.on('zoom.end', zoomend);
		
		// initialise brush state 
		context.append("g")
			.attr("class", "brush")
			.on("click", brushed)
			.call(brush)
			.call(brush.move, [w-(dates.length/w)*50, w]);
		
		// initialise zoom state
		focus.call(zoom)

		// define brush behaviour
		function brushed() {

			if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom

			var s;
			if (!d3.event.selection) {
				if (d3.event.sourceEvent !== undefined) {
					e = d3.event.sourceEvent.x;
					s = [e-60-(dates.length/w)*25, e-60+(dates.length/w)*25];
					brushTransform(s);
				}
			}

			else {
				s = d3.event.selection;
				brushTransform(s);
			}

			function brushTransform(s) {
				focus.select(".axis--x").call(xAxis);
				focus.call(zoom.transform, d3.zoomIdentity.scale((w / (s[1] - s[0])))
														  .translate(-s[0], 0));
			}
		}

		// define zoom behaviour
		function zoomed() {

			if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush

			var t = d3.event.transform;
			let xScaleZ = t.rescaleX(xScale);

			let hideTicksWithoutLabel = function () {
				d3.selectAll('.xAxis .tick text').each(function (d) {
					if (this.innerHTML === '') {
						this.parentNode.style.display = 'none'
					}
				})
			}

			gX.call(
				d3.axisBottom(xScaleZ).tickFormat((d) => dateFormatter(d))
			)

			candles.attr("x", (d, i) => xScaleZ(i) - (xBand.bandwidth() * t.k) / 2)
				   .attr("width", xBand.bandwidth() * t.k);resizeTimer

			stems.attr("x1", (d, i) => xScaleZ(i) - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5);
			stems.attr("x2", (d, i) => xScaleZ(i) - xBand.bandwidth() / 2 + xBand.bandwidth() * 0.5);

			hideTicksWithoutLabel();
			
			gX.selectAll(".tick text")
				.call(wrap, xBand.bandwidth())

			focus.select(".axis--x").call(xAxis);
			context.select(".brush").call(brush.move, xScale.range().map(t.invertX, t));

		}

		// define zoom-end behaviour
		function zoomend() {

			var t = d3.event.transform;
			let xScaleZ = t.rescaleX(xScale);

			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(function () {

				xmin = new Date(xDateScale(Math.floor(xScaleZ.domain()[0])));
				xmax = new Date(xDateScale(Math.floor(xScaleZ.domain()[1])));
				filtered = _.filter(prices, d => ((d.Date >= xmin) && (d.Date <= xmax)));
				minP = +d3.min(filtered, d => d.Low);
				maxP = +d3.max(filtered, d => d.High);
				buffer = Math.floor((maxP - minP) * 0.1);

				yScale.domain([minP - buffer, maxP + buffer])
				candles.transition()
					.duration(800)
					.attr("y", (d) => yScale(Math.max(d.Open, d.Close)))
					.attr("height", d => (d.Open === d.Close) ? 1 : yScale(Math.min(d.Open, d.Close)) - yScale(Math.max(d.Open, d.Close)));

				stems.transition()
					 .duration(800)
					 .attr("y1", (d) => yScale(d.High))
					 .attr("y2", (d) => yScale(d.Low));

				gY.transition().duration(800).call(d3.axisLeft().scale(yScale));

			}, 300)

		}

		function dateFormatter(d) {
			var d = dates[d]
			if (d !== undefined) {
				var hours = d.getHours();
				var minutes = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
				var amPM = hours < 13 ? 'am' : 'pm';
				return hours + ':' + minutes + amPM + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
			}
		}

	});
}

function wrap(text, width) {
	text.each(function () {
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