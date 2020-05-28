const Font = require("../../");

var libraries = [
    {
        name: "feather",
        host: "github",
        repo: {
            owner: "feathericons",
            name: "feather",
        },
        branch: "master",
        prefix: "fe",
        images: {
            path: "icons",
            format: "svg",
        },
    },
    {
        name: "bootstrap-icons",
        host: "github",
        repo: {
            owner: "twbs",
            name: "icons",
        },
        branch: "master",
        prefix: "fe",
        images: {
            path: "icons",
            format: "svg",
        },
    },
    // {
    // 	name: "simple-icons",
    // 	host: this.host.github,
    // 	repo: "/simple-icons/simple-icons",
    // 	branch: "/master",
    // 	prefix: "si",
    // 	images: {
    // 		path: "/icons",
    // 		format: "svg",
    // 	},
    // },
];

async function run() {
    for(var i = 0; i < libraries.length; i++) {
        var library = libraries[i];
        var font = new Font(library);
        await font.update();
        await font.optimize();
        await font.generate();
    }
    console.log("Run completed");
}

run();

// var questions = [
//     {
//       type: 'confirm',
//       name: 'toBeDelivered',
//       message: 'Is this for delivery?',
//       default: false
//     },
//     {
//       type: 'input',
//       name: 'phone',
//       message: "What's your phone number?",
//       validate: function(value) {
//         var pass = value.match(
//           /^([01]{1})?[-.\s]?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\s?((?:#|ext\.?\s?|x\.?\s?){1}(?:\d+)?)?$/i
//         );
//         if (pass) {
//           return true;
//         }
  
//         return 'Please enter a valid phone number';
//       }
//     },
//     {
//       type: 'list',
//       name: 'size',
//       message: 'What size do you need?',
//       choices: ['Large', 'Medium', 'Small'],
//       filter: function(val) {
//         return val.toLowerCase();
//       }
//     },
//     {
//       type: 'input',
//       name: 'quantity',
//       message: 'How many do you need?',
//       validate: function(value) {
//         var valid = !isNaN(parseFloat(value));
//         return valid || 'Please enter a number';
//       },
//       filter: Number
//     },
//     {
//       type: 'expand',
//       name: 'toppings',
//       message: 'What about the toppings?',
//       choices: [
//         {
//           key: 'p',
//           name: 'Pepperoni and cheese',
//           value: 'PepperoniCheese'
//         },
//         {
//           key: 'a',
//           name: 'All dressed',
//           value: 'alldressed'
//         },
//         {
//           key: 'w',
//           name: 'Hawaiian',
//           value: 'hawaiian'
//         }
//       ]
//     },
//     {
//       type: 'rawlist',
//       name: 'beverage',
//       message: 'You also get a free 2L beverage',
//       choices: ['Pepsi', '7up', 'Coke']
//     },
//     {
//       type: 'input',
//       name: 'comments',
//       message: 'Any comments on your purchase experience?',
//       default: 'Nope, all good!'
//     },
//     {
//       type: 'list',
//       name: 'prize',
//       message: 'For leaving a comment, you get a freebie',
//       choices: ['cake', 'fries'],
//       when: function(answers) {
//         return answers.comments !== 'Nope, all good!';
//       }
//     }
// ];

// inquirer.prompt(questions).then(answers => {
//     console.log('\nOrder receipt:');
//     console.log(JSON.stringify(answers, null, '  '));
// });

// var argv = require('yargs')
//     .usage('Usage: $0 <command> [options]')
//     .command('count', 'Count the lines in a file')
//     .command('test', 'TEst Count the lines in a file')
//     .example('$0 count -f foo.js', 'count the lines in the given file')
//     .alias('f', 'file')
//     .nargs('f', 1)
//     .describe('f', 'Load a file')
//     // .demandOption(['f'])
//     .help('h')
//     .alias('h', 'help')
//     .epilog('copyright 2019')
//     .argv;

// {
//     alias: 'font',
//     demandOption: false,
//     describe: 'update font library with this name.',
//     type: 'string',
//     default: "undefined"
// }