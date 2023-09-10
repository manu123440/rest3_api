const express = require('express');

const { body, validationResult } = require('express-validator');

const request = require('request');

const router = express.Router();

const baseUrl = "https://bhaveshnetflix.live/";

let selectFunction = (item) => {
  let options = {
    method: "POST",
    url: baseUrl + "select.php",
    formData: {
      select_query: item,
    },
  };
  return options;
};

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
};

router.post('/payment',
	[
		body('email')
			.trim()
			.notEmpty()
			.withMessage('Email Address required')
			.normalizeEmail()
			.isEmail()
			.withMessage('Invalid email'),
		body('id')
			.trim()
			.notEmpty()
			.withMessage('Order ID required'),
		body('currency')
      .trim()
      .notEmpty()
      .withMessage('Currency required')
      .isIn(['btc', 'eth', 'usdt', 'ada', 'bnb', 
                'xrp', 'sol', 'dot', 'doge', 'ltc'])
      .withMessage('This is not a valid Currency'),
	],
 	async (req, res, next) => {
		const { email, id, currency } = req.body;

		// console.log(email);

		// fetch data from database
		let opt1 = selectFunction(
			"select * from users where email = '"
				.concat(`${email}`)
				.concat("'")
		);

		try {
			const error = validationResult(req);

			if (!error.isEmpty()) {
				// console.log(error.array());
				return res.json({
					isSuccess: false,
					address: '',
					amount: '',
			    errorMessage: error.array()[0].msg
				})
			}

			else {
				request(opt1, (error, response) => {
					if (error) throw new Error(error);
					else {
						let opt2 = selectFunction(
							"select amount from plan where id = '"
								.concat(`${id}`)
								.concat("'")
						);

						request(opt2, function (error, response) {
						  if (error) throw new Error(error);
						  else {
						  	let x = JSON.parse(response.body);

						  	// console.log(x);

						  	if (x.length >= 1) {
						  		let options = {
									  'method': 'POST',
									  'url': 'https://api-sandbox.nowpayments.io/v1/payment',
									  'headers': {
									    'x-api-key': '5RBGE0W-0MTMWKD-KEHQK25-DX4Q6Q5',
									    'Content-Type': 'application/json'
									  },
									  body: JSON.stringify({
									    "price_amount": x[0].amount,
									    "price_currency": 'eur',
									    "pay_currency": currency,
									    "ipn_callback_url": `http://localhost:3000/v1/notify/?email=${email}&plan=${id}`,
									    "order_id": id,
								      "case": "success"
									  })
									};

									request(options, (error, response) => {
									  if (error) throw new Error(error);
									  else {
									  	let y = JSON.parse(response.body);

									  	// console.log(y);

									  	if (y.hasOwnProperty('code') && y.code === 'AMOUNT_MINIMAL_ERROR') {
									  		return res.json({
										  		isSuccess: false,
										  		address: '',
													amount: '',
										  		errorMessage: 'Change Crypto'
										  	})
									  	}

									  	else if (y.hasOwnProperty('payment_id')) {
									  		// update payment_id in db

									  		let opt3 = updateFunction(
													"update users SET payment_id = '"
														.concat(`${y['payment_id']}`)
														.concat("' where email = '")
														.concat(`${email}`)
														.concat("'"),
													"select * from users where email = '"
														.concat(`${email}`)
														.concat("'")
												);

												request(opt3, (error, response) => {
												  if (error) throw new Error(error);
												  else {
												  	let z = JSON.parse(response.body);

												  	// console.log(z);

												  	if (z.length >= 1) {
												  		return res.json({
													  		isSuccess: true,
													  		address: y.pay_address,
													  		amount: y.pay_amount,
													  		errorMessage: ''
													  	})
												  	}

												  	else {
												  		return res.json({
													  		isSuccess: false,
													  		address: '',
													  		amount: '',
													  		errorMessage: 'failed...'
													  	})
												  	}
												  }
												})
									  	}
									  	else {
									  		return res.json({
										  		isSuccess: false,
										  		address: '',
													amount: '',
										  		errorMessage: 'failed...'
										  	})
									  	}
									  }
									});
						  	}

						  	else {
						  		return res.json({
										isSuccess: false,
										address: '',
										amount: '',
								    errorMessage: 'Invalid Plan ID...'
									})
						  	}
						  }
						});
					}
				})
			}
		}
		catch(error) {
			// console.log(error);
			return res.json({
				isSuccess: false,
				address: '',
				amount: '',
			  errorMessage: "Invalid Email, Try Again...."
			})
		}
	}
)

module.exports = router;
