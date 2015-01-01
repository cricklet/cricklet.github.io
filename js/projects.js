function wrapImgs() {
  $('img').each(function () {
    var $img = $(this),
    href = $img.attr('src');
    $img.wrap('<a href="' + href + '"></a>');
  });
}

function updateProjects() {
  var hash = window.location.hash;
  var path = window.location.pathname + hash;
  $('header a').removeClass('bold');
  $('header a[href="' + path + '"]').addClass('bold');

  if (hash.charAt(0) == '#') hash = hash.substr(1);
  if (hash.length > 0) {
    $('.project').hide();
    $('.project-' + hash).show();
  }

  window.scrollTo(0, 0);
}

$(document).ready(function () {
  wrapImgs();
  updateProjects();

  window.addEventListener("hashchange", function () {
    updateLinks();
    updateProjects();
  }, false);
});
