
// Draw a candlestick chart based on passed prices
function drawChart() {

	d3.csv("FTSE.csv").then(function(prices) {

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
/* 		svg.append("defs")
		   .append("clipPath")
			.attr("id", "clip")
			.attr("transform", "translate("+-100+",0)")
		   .append("rect")
		    .attr("width", w)
			.attr("height", h)
			.attr("transform", "translate("+-100+",0)"); */
		
		var zoom = d3.zoom()
					 .scaleExtent([0.75, 15000])
					 .translateExtent([[-10000, -10000], [10000, 10000]])
					 .on("zoom", zoomed);
		
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
		   			.attr("class", "axis") //Assign "axis" class
		   			.attr("transform", "translate(0," + h + ")")
		   			.call(xAxis);
		
		// y axis
		var ymin = d3.min(prices.map(function(r){return r.Low;}));
		var ymax = d3.max(prices.map(function(r){return r.High;}));
		var yScale = d3.scaleLinear().domain([ymin, ymax]).range([h, 0]).nice();
		var yAxis = d3.axisLeft()
					  .scale(yScale)
				      .ticks(Math.round((ymax - ymin)/100))
		
		var gY = svg.append("g")
		   			.attr("class", "axis")
		   			.call(yAxis);
		
		// draw rectangles
		svg.selectAll("rect")
		   .data(prices)
		   .enter()
		   .append("rect")
		   .attr("x", function(d){
				return xScale(d.Date);
		   })
		   .attr("y", function(d){return yScale(Math.max(d.Open, d.Close));})
		   .attr("width", function(d){return 0.5*w/prices.length;})
		   .attr("height", function(d){return yScale(Math.min(d.Open, d.Close))-yScale(Math.max(d.Open, d.Close	));})
		   .attr("fill", function(d){return d.Open>d.Close ? "red" : "green"});
		
		// draw high and low
		svg.selectAll("g.line")
		   .data(prices)
		   .enter()
		   .append("line")
		   .attr("class", "stem")
		   .attr("x1", function(d){ return xScale(d.Date) + 0.25*w/prices.length; })
		   .attr("x2", function(d){ return xScale(d.Date) + 0.25*w/prices.length; })
		   .attr("y1", function(d){return yScale(d.High);})
		   .attr("y2", function(d){return yScale(d.Low);})
		   .attr("stroke", function(d){return d.Open > d.Close ? "red" : "green"; })

		function zoomed() {

			gX.call(xAxis.scale(d3.event.transform.rescaleX(xScale)));
			gY.call(yAxis.scale(d3.event.transform.rescaleY(yScale)));
			var t = d3.event.transform, xt = t.rescaleX(xScale), yt = t.rescaleY(yScale)
			//svg.select(".line")
			//   .attr("d",priceSeries.x(function(d) { return xt(d.dt);})
			//							 .y(function(d) { return yt(d.price);}));
		};
			  

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