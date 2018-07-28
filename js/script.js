
// Draw a candlestick chart based on passed prices
function drawChart() {

	d3.csv("FTSE.csv").then(function(prices) {

		const candleWidth = 5

		for (var i = 0; i < prices.length; i++) {
			var dateFormat = d3.timeParse("%Y-%m-%d");
			prices[i]['Date'] = dateFormat(prices[i]['Date'])
		}

		var margin = {top: 15, right: 65, bottom: 25, left: 50},
		w = 1190 - margin.left - margin.right,
		h = 680 - margin.top - margin.bottom;
		
		var svg = d3.select("#candleChart")
					.append("svg")
					.attr("width", w + margin.left + margin.right)
					.attr("height", h + margin.top + margin.bottom)
					.append("g")
					.attr("transform", "translate(" +margin.left+ "," +margin.top+ ")");
		
		// Clip path to prevent shapes 'leaking' outside chart body
		svg.append("defs")
		   .append("clipPath")
			.attr("id", "clip")
		   .append("rect")
		    .attr("width", w)
			.attr("height", h)

		var chartBody = svg.append("g")
					.attr("class", "chartBody")
					.attr("clip-path", "url(#clip)");

		// x axis
		var xmin = d3.min(prices.map(function(r){ return r.Date.getTime(); }));
		var xmax = d3.max(prices.map(function(r){ return r.Date.getTime(); }));
		var xScale = d3.scaleBand().domain(_.map(prices, 'Date'))
					   .range([0, w])
					   .padding(0.2)
		var xAxis = d3.axisBottom()
					   .scale(xScale)
					   .tickFormat(function(d, i){ if (i % 14 == 0) {return d.getDate() + ' ' + getShortMonth(d)}});

		var gX = svg.append("g")
		   			.attr("class", "x axis") //Assign "axis" class
					   .attr("transform", "translate(0," + h + ")")
					   .attr("clip-path", "url(#clip)")
		   			.call(xAxis);
		
		// y axis
		var ymin = d3.min(prices.map(function(r){return r.Low;}));
		var ymax = d3.max(prices.map(function(r){return r.High;}));
		var yScale = d3.scaleLinear().domain([ymin, ymax]).range([h, 0]).nice();
		var yAxis = d3.axisLeft()
					  .scale(yScale)
				      .ticks(Math.round((ymax - ymin)/100))
		
		var gY = svg.append("g")
		   			.attr("class", "y axis")
		   			.call(yAxis);
		
		// draw rectangles
		chartBody.selectAll("rect")
		   .data(prices)
		   .enter()
		   .append("rect")
		   .attr("x", function(d){
				return xScale(d.Date);
		   })
		   .attr("class", "candle")
		   .attr("y", function(d){return yScale(Math.max(d.Open, d.Close));})
		   .attr("width", candleWidth)
		   .attr("height", function(d){return yScale(Math.min(d.Open, d.Close))-yScale(Math.max(d.Open, d.Close	));})
		   .attr("fill", function(d){return d.Open>d.Close ? "red" : "green"});
		
		// draw high and low
		chartBody.selectAll("g.line")
		   .data(prices)
		   .enter()
		   .append("line")
		   .attr("class", "stem")
		   .attr("x1", function(d){return xScale(d.Date) + 0.5*candleWidth; })
		   .attr("x2", function(d){return xScale(d.Date) + 0.5*candleWidth; })
		   .attr("y1", function(d){return yScale(d.High);})
		   .attr("y2", function(d){return yScale(d.Low);})
		   .attr("stroke", function(d){return d.Open > d.Close ? "red" : "green"; })

		svg.append("rect")
		   .attr("id","rect")
		   .attr("width", w)
		   .attr("height", h)
		   .style("fill", "none")
		   .style("pointer-events", "all")
		
		d3.select("#rect").call(zoom);

		function zoom(svg) {
			const extent = [[margin.left, margin.top], [w - margin.right, h - margin.top]];
			console.log("Zoom")
			
			d3.select("#rect").call(d3.zoom()
				.scaleExtent([1, 8])
				.translateExtent(extent)
				.extent(extent)
				.on("zoom", zoomed));
			
			function zoomed() {
			  var t = d3.event.transform, yt = t.rescaleY(yScale)

			  xScale.range([0, w].map(d => d3.event.transform.applyX(d)));
			  chartBody.selectAll(".candle").attr("x", d => xScale(d.Date)).attr("width", xScale.bandwidth());
			  chartBody.selectAll(".stem").attr("x1", d => xScale(d.Date) + xScale.bandwidth()/2);
			  chartBody.selectAll(".stem").attr("x2", d => xScale(d.Date) + xScale.bandwidth()/2);
			  gX.call(xAxis)

			  chartBody.selectAll(".candle").attr("y", d => yt(Math.max(d.Open, d.Close)));
			  chartBody.selectAll(".candle").attr("height", d => yt(Math.min(d.Open, d.Close))-yt(Math.max(d.Open, d.Close)));
			  chartBody.selectAll(".stem").attr("y1", d => yt(d.High));
			  chartBody.selectAll(".stem").attr("y2", d => yt(d.Low));
			  gY.call(yAxis.scale(d3.event.transform.rescaleY(yScale)));

			}
		}

	});
}

function getShortMonth(date){
	var month = date.getMonth()
	months = {0 : 'Jan', 1 : 'Feb', 2 : 'Mar', 3 : 'Apr', 4 : 'May', 5 : 'Jun', 6 : 'Jul', 7 : 'Aug', 8 : 'Sep', 9 : 'Oct', 10 : 'Nov', 11 : 'Dec'}

	if (month == 0 | month == 7){
		return months[month] + ' ' + date.getFullYear()
	}
	else {
		return months[month]
	}
}

drawChart();