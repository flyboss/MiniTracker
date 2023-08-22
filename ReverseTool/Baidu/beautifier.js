function jsBeautify(code) {
  return UglifyJS.minify(code, {mangle: false, compress: false, output: {beautify: true, comments: true}}).code;
}

function swanBeautify(code) {
  return beautify_html(code, {indent_size: 2, space_in_empty_paren: true});
}
