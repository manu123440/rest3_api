const express = require('express');

const { param, body, validationResult } = require('express-validator');

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

router.get('/video/:id',
	[
		param('id')
      .trim()
      .notEmpty()
      .withMessage('ID Required')
      .matches(/^[0-9]*$/)
      .withMessage('Only Characters with numbers are allowed'),
    body('email')
    	.trim()
			.notEmpty()
			.withMessage('Email Address required')
			.normalizeEmail()
			.isEmail()
			.withMessage('Invalid email'),
	],
	async (req, res, next) => {
		const { id } = req.params;

		const { email } = req.body;

		// console.log(id);

		let opt1 = selectFunction(
			"select no_of_days from users where email = '"
				.concat(`${email}`)
				.concat("'")
		);

		// console.log(opt1);

		try {
			const error = validationResult(req);

			if (!error.isEmpty()) {
				// console.log(error.array());
				return res.json({
					isSuccess: false,
					videoUrl: "",
					errorMessage: error.array()[0].msg
				})
			}

			else {
				request(opt1, (error, response) => {
          if (error) throw new Error(error);
					else {
						let y = JSON.parse(response.body);

						// console.log(y);

						if (y.length >= 1 && Number(y[0].no_of_days) >= 0) {
							const noOfDays = Number(y[0].no_of_days);

							// console.log(noOfDays);

							let opt2 = selectFunction(
								"select * from videos where video_id = '"
									.concat(`${id}`)
									.concat("'")
							);

							request(opt2, (error, response) => {
								if (error) throw new Error(error);
					      else {
					       	let x = JSON.parse(response.body);

					       	// console.log(x);

					       	if (x.length >= 1) {
					       		const i = x[0].video_url;

					       		if (i === '') {
					       			return res.json({
												isSuccess: false,
												videoUrl: "",
												errorMessage: "No data found..."
											})
					       		}

					       		else {
						       		const regex = /\/([^/]+)$/; // Matches the last part of the URL after the last "/"

											const match = i.match(regex);

											if (match) {
											  const extractedString = match[1];
											  const fileCode = extractedString;

											  // console.log(fileCode);

											  const url = `https://uptobox.fr/api/streaming?token=45701da784b02110e845cb7b8a8872577d32q&file_code=${fileCode}`;

											  const opt3 = {
												  'method': 'GET',
												  'url': url,
												  'headers': {
												  }
												};

												request(opt3, function (error, response) {
												  if (error) throw new Error(error);
												  else {
												  	let z = JSON.parse(response.body);

												  	// console.log(z);

												  	if (z.message === 'Success') {
												  		return res.json({
																isSuccess: true,
																videoUrl: z.data.streamLinks.src,
																errorMessage: ""
															})
												  	}

												  	else {
												  		return res.json({
																isSuccess: false,
																videoUrl: "",
																errorMessage: "No data found..."
															})
												  	}
												  }
												});
											} 

											else {
											  return res.json({
													isSuccess: false,
													videoUrl: "",
													errorMessage: "No data found..."
												})
											}	
										}				        	
					       	}

					       	else {
					        	return res.json({
											isSuccess: false,
											videoUrl: "",
											errorMessage: "No data found..."
										})
					       	}
					      }
							})
						}
						else {
							return res.json({
								isSuccess: false,
								videoUrl: "",
								errorMessage: "No Subscription Found..."
							})
						}
					}
				})
			}
		}

		catch(error) {
			return res.json({
				isSuccess: false,
				videoUrl: "",
				errorMessage: "No data found..."
			})
		}
})

module.exports = router;
