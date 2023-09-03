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

let insertFunction = (item, item2) => {
  let options = {
    method: "POST",
    url: baseUrl + "insert.php",
    formData: {
      insert_query: item,
      select_query: item2,
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
}

router.post("/login", 
	[
	  body('email')
			.trim()
			.notEmpty()
			.withMessage('Email Address required')
			.normalizeEmail()
			.isEmail()
			.withMessage('Invalid email'),
		body('telegram')
			.trim()
			.notEmpty()
			.withMessage('Telegram required'),
		body('imei')
			.trim()
			.notEmpty()
			.withMessage('imei required'),
	], 
	async (req, res, next) => {
		const { email, imei, telegram } = req.body;

		// let isSuccess = false;

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
					errorMessage: error.array()[0].msg
				})
			}

			else {
				request(opt1, (error, response) => {
					if (error) throw new Error(error);
					else {
						let x = JSON.parse(response.body);

						// console.log(x);

						// Regsiter the user
						if (x.length === 0) {
							let values1 = `\'${email}\', '${telegram}\', 'null\', '${imei}\', 'null\', 'null\', 'null\', 'null\', 'null\', 'null\'`;

					    let opt2 = insertFunction(
					      "insert into users (email, telegram, otp, imei, sub_date, plan_id, no_of_days, paid, status, payment_id) values(" 
					      	.concat(`${values1}`)
					      	.concat(")"),
								"select * from users where email = '"
								  .concat(`${email}`)
								  .concat("'")
					    );

					    // console.log(opt2, values1);

					    request(opt2, (error, response) => {
					    	if (error) throw new Error(error);
					    	else {
					    		let y = JSON.parse(response.body);

					    		// console.log(y);

					    		if ( y.length >= 1) {
					    			// user successfully registered...
					    			return res.json({
											isSuccess: true,
											errorMessage: ''
										})
					    		}

					    		else {
					    			return res.json({
											isSuccess: false,
											errorMessage: 'Failed to add user...'
										})
					    		}
					    	}
					    })
						}

						// User Login
						else {
							if (Number(x[0].imei) === Number(imei)) {
								// user log's in
								return res.json({
									isSuccess: true,
									errorMessage: ''
								})
							}

							else {
								// user logged in to another device
								// update imei to req.body.imei

								let opt3 = updateFunction(
									"update users SET imei = '"
										.concat(`${imei}`)
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
												errorMessage: ''
											})
										}

										else {
											return res.json({
												isSuccess: false,
												errorMessage: 'Failed'
											})
										}
									}
								})
							}
						}

					}
				})
			}
		}
		
		catch (error) {
			return res.json({
				isSuccess: false,
				errorMessage: 'Failed'
			})
		}
	}
)

module.exports = router;