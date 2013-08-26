var metas = document.getElementsByTagName('meta');
var i;
if (navigator.userAgent.match(/iPhone/i)) {
  for (i=0; i<metas.length; i++) {
    if (metas[i].name == "viewport") {
      metas[i].content = "width=device-width, minimum-scale=1.0, maximum-scale=1.0";
    }
  }
  document.addEventListener("gesturestart", gestureStart, false);
}
function gestureStart() {
  for (i=0; i<metas.length; i++) {
    if (metas[i].name == "viewport") {
      metas[i].content = "width=device-width, minimum-scale=0.25, maximum-scale=1.6";
    }
  }
}

var path = window.location.pathname;
while (path.charAt(0) === '/')
	path = path.substring(1);

var header = document.getElementById('header');
var children = header.children;
for (var i = 0; i < children.length; i ++) {
	var child = children[i];
	var href = child.getAttribute('href');
	if (href == null) continue;
	
	while (href.charAt(0) === '/')
		href = href.substring(1);
	
	console.log(path, href, path.valueOf() === href.valueOf());
	if (path.valueOf() === href.valueOf()) {
		child.setAttribute('class', 'bold');
		console.log('SETTING TO BOLD', href + ', ' + path);
	}
}
