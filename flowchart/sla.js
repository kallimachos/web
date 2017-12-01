// Requires
// https://cdnjs.cloudflare.com/ajax/libs/raphael/2.2.7/raphael.js
// https://cdnjs.cloudflare.com/ajax/libs/flowchart/1.7.0/flowchart.js

var toParse = `start=>start: New SLA case
        prod_down=>condition: Production down or data loss?
        prod_affected=>condition: Production affected and no workaround?
        handle=>operation: Handle accordingly
        questionable=>end: Questionable S1/S2 response

        start->prod_down
        prod_down(no)->prod_affected
        prod_down(yes)->handle
        prod_affected(yes)->handle
        prod_affected(no)->questionable`;

var diagram = flowchart.parse(toParse);
diagram.drawSVG('diagram', {
    'text-margin': 0,
    'font-size': 14,
    'symbols': {
        'start': {
            'font-color': 'red',
            'fill': 'yellow'
            },
        'condition':{
            'fill': 'whitesmoke'
            },
        'operation':{
            'font-color': 'white',
            'fill': 'green'
            },
        'end':{
            'font-color': 'white',
            'class': 'end-element',
            'fill': 'red'
            }
        },
    }
);
