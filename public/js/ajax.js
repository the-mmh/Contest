$(document).ready(() => {
    $.ajax({
        url: '/admin/allprob/query',
        success: function(res) {
            var x = $('tbody');
            x.html('');
            // console.log(res.obj);
            res.obj.forEach((row) => {
                x.append('\
                    <tr>\
                    <td>' + row.probCode + '</td>\
                    <td>' + row.score + '</td>\
                    <td><a href="/admin/statement/' + row.probCode + '">Click</a></td>\
                    </tr>\
                ');
            })
        }
    })
})
$(function() {
    $('#code').on('click', function() {
        $.ajax({
            url: '/admin/allprob/query?sortby=code',
            success: function(res) {
                var x = $('tbody');
                x.html('');
                // console.log(res.obj);
                res.obj.forEach((row) => {
                    x.append('\
                        <tr>\
                        <td>' + row.probCode + '</td>\
                        <td>' + row.score + '</td>\
                        <td><a href="/admin/statement/' + row.probCode + '">Click</a></td>\
                        </tr>\
                    ');
                })
            }
        })
    })
})
$(function() {
    $('#score').on('click', function() {
        $.ajax({
            url: '/admin/allprob/query?sortby=score',
            success: function(res) {
                var x = $('tbody');
                x.html('');
                // console.log(res.obj);
                res.obj.forEach((row) => {
                    x.append('\
                        <tr>\
                        <td>' + row.probCode + '</td>\
                        <td>' + row.score + '</td>\
                        <td><a href="/admin/statement/' + row.probCode + '">Click</a></td>\
                        </tr>\
                    ');
                })
            }
        })
    })
})