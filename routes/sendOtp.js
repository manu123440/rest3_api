const express = require('express');

const { body, validationResult } = require('express-validator');

const request = require('request');

const router = express.Router();

const baseUrl = "https://bhaveshnetflix.live/";

let updateFunction = (item, item2) => {
	let options = {
	    method: "POST",
	    url: baseUrl + "update.php",
	    formData: {
	      update_query: item,
	      select_query: item2,
	    },
  	};
  	return options;
}

function random() {
    let num = '';
    for (let i = 0; i < 5; i++) {
        num += Math.floor(Math.random() * 10);
    }
    return num;
}

const array = [
	{ lang: 'en',
	  msg: "Do not share it with anyone, even if they claim to work for H4KIG. This code can only be used to log in to your app. We will never ask you for it for any other purpose. If you didn't request this code while trying to log in from another device, you can ignore this message." },
	{ lang: 'fr',
	  msg: "Ne le communiquez à personne, même si quelqu'un prétend être un employé de H4KIG. Ce code est uniquement destiné à être utilisé pour vous connecter à votre application. Nous ne vous le demanderons jamais pour d'autres raisons. Si vous n'avez pas demandé ce code en essayant de vous connecter depuis un autre appareil, vous pouvez ignorer ce message." }
];

router.post('/sendOtp', 
	[
		body('email')
			.trim()
			.notEmpty()
			.withMessage('Email Address required')
			.normalizeEmail()
			.isEmail()
			.withMessage('Invalid email'),
		body('lang')
	        .trim()
	        .notEmpty()
	        .withMessage('Language required')
	        .isIn(['en', 'fr'])
	        .withMessage('Select a valid Language'),
	],
 	async (req, res, next) => {
		const { email, lang } = req.body;

		let msgBody = '';

		try {
			const error = validationResult(req);

			if (!error.isEmpty()) {
				// console.log(error.array());
				return res.json({
					isSuccess: false,
					errorMessage: error.array()[0].msg
				})
			}

			else {
				let rNumber = '';
		    	rNumber = random();
		    	console.log(rNumber);

		    	if (lang === array[1].lang) {
		    		msgBody = `Code de connexion : ${rNumber}. ${array[1].msg}`;
		    	}
		    	else if (lang === array[0].lang) {
		    		msgBody = `Connection Code : ${rNumber}. ${array[0].msg}`;
		    	}

		    	// console.log(msgBody);

		    	const opt1 = {
				  'method': 'POST',
				  'url': 'https://bhaveshnetflix.live/sendMail.php',
				  'headers': {
				    'Content-Type': 'application/x-www-form-urlencoded'
				  },
				  form: {
				    'receiver': email,
				    'subject': 'Hi,',
				    'msg': msgBody
				  }
				};

				request(opt1, function (error, response) {
				  	if (error) throw new Error(error);
				  	else {
				  		// console.log(response.body);

				  		return res.json({
				  			otp: rNumber,
				  			response: response.body
				  		})
				  		// let x = JSON.parse(response.body);

				  		// console.log(x);

				  		// if (x.length >= 1) {
				  		// 	// insert otp into database

				      	// 	let opt2 = updateFunction(
				      	// 		"update users set otp = '"
				      	// 		.concat(`${rNumber}`)
				      	// 		.concat("' where email = '")
				      	// 		.concat(`${email}`)
				      	// 		.concat("'"),
				      	// 		"select * from users where email = '"
						//         .concat(`${email}`)
						//         .concat("'")
				      	// 	)

				      	// 	// console.log(opt1);

				      	// 	request(opt2, (error, response) => {
				      	// 		if (error) throw new Error(error);
						// 	    else {
						// 	        let y = JSON.parse(response.body);

						// 	        // console.log(x);

						// 	        if (y.length >= 1) {
						// 	        	return res.json({
						// 		    		isSuccess: true,
						// 		    		errorMessage: "E-mail sent successfully!"
						// 		    	})
						// 	        }
						// 	        else {
						// 	        	return res.json({
						// 		    		isSuccess: false,
						// 		    		errorMessage: "You are not registered..."
						// 		    	})
						// 	        }
						// 	    }
				      	// 	})
				  		// }

				  		// else {
				  		// 	return res.json({
				      	// 		isSuccess: false,
				      	// 		errorMessage: "Error sending E-mail...."
				      	// 	})
				  		// }
				  	}
				})
		    }
		}

		catch(error) {
		    return res.json({
			   	isSuccess: false,
			   	errorMessage: "Error sending E-mail..."
			})
		}
	}
)

module.exports = router;