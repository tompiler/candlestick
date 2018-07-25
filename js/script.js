
var data = []
d3.csv("FTSE.csv").then(function(prices) {
	for (var i = 0; i < prices.length; i++) {
		//var dateFormat = d3.timeParse("%Y-%m-%d");
		//prices[i]['Date'] = dateFormat(prices[i]['Date'])
		data.push(prices[i]);
	}
});

function keyToArray(arr, key){
	var dateFormat = d3.timeParse("%Y-%m-%d");
	var output = []
	for (i = 0; i < arr.length; i++){
		output.push(dateFormat(arr[i]["Date"]));
	}
	return output;
}


console.log(_.map(data, 'Date'));

// Draw a candlestick chart based on passed prices
function drawChart() {

	d3.csv("FTSE.csv").then(function(prices) {
		console.log(prices);
		var margin = {top: 15, right: 65, bottom: 25, left: 50},
		w = 1190 - margin.left - margin.right,
		h = 680 - margin.top - margin.bottom;
		
		var svg = d3.select("#candleChart").append("svg")
					.attr("width", w + margin.left + margin.right)
					.attr("height", h + margin.top + margin.bottom)
					.append("g")
					.attr("transform", "translate(" +margin.left+ "," +margin.top+ ")");
		
		// x axis
		var dateFormat = d3.timeParse("%Y-%m-%d");
		var xmin = d3.min(data.map(function(r){ return dateFormat(r.Date).getTime(); }));
		var xmax = d3.max(data.map(function(r){ return dateFormat(r.Date).getTime(); }));
		//var xScale = d3.scaleLinear().domain([xmin, xmax]).range([0, w]).nice();
		var xScale = d3.scaleBand().domain(keyToArray(data, "Date"))
					   .range([margin.left, w])
					   .padding(0.2)
					   
		var xAxis = d3.axisBottom()
					   .scale(xScale)
					   .tickFormat(function(d, i){ if (i % 14 == 0) {return d.getDate() + ' ' + getShortMonth(d)}});

		svg.append("g")
		   .attr("class", "axis") //Assign "axis" class
		   .attr("transform", "translate(0," + h + ")")
		   .call(xAxis);
		
		// y axis
		var ymin = d3.min(data.map(function(r){return r.Low;}));
		var ymax = d3.max(data.map(function(r){return r.High;}));
		console.log(Math.round((ymax - ymin)/100));
		var yScale = d3.scaleLinear().domain([ymin, ymax]).range([h, 0]).nice();
		var yAxis = d3.axisLeft()
					  .scale(yScale)
				      .ticks(Math.round((ymax - ymin)/100))
		
		svg.append("g")
		   .attr("class", "axis")
		   .call(yAxis);
		
		// draw rectangles
		svg.selectAll("rect")
		   .data(data)
		   .enter()
		   .append("rect")
		   .attr("x", function(d){
				return xScale(dateFormat(d.Date));
		   })
		   .attr("y", function(d){return yScale(Math.max(d.Open, d.Close));})
		   .attr("width", function(d){return 0.5*w/data.length;})
		   .attr("height", function(d){return yScale(Math.min(d.Open, d.Close))-yScale(Math.max(d.Open, d.Close	));})
		   .attr("fill", function(d){return d.Open>d.Close ? "red" : "green"});
		
		// draw high and low
		svg.selectAll("g.line")
		   .data(data)
		   .enter()
		   .append("line")
		   .attr("class", "stem")
		   .attr("x1", function(d){ return xScale(dateFormat(d.Date)) + 0.25*w/data.length; })
		   .attr("x2", function(d){ return xScale(dateFormat(d.Date)) + 0.25*w/data.length; })
		   .attr("y1", function(d){return yScale(d.High);})
		   .attr("y2", function(d){return yScale(d.Low);})
		   .attr("stroke", function(d){return d.Open > d.Close ? "red" : "green"; })

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