const express = require('express');

const { param, body, validationResult } = require('express-validator');

const request = require('request');

const axios = require('axios');

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

		const videoArray = [];

		const langArray = [];

		const fileCodeArray = [];

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
					langArray: [],
					videoUrl: [],
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
					       		x.forEach(async (i) => {
					       			const lang = i.lang;
					       			const video = i.video_url;
					       			const subUrl = i.sub_url;

					       			langArray.push(lang);

					       			const regex = /\/([^/]+)$/; // Matches the last part of the URL after the last "/"

					       			if (video !== '' || subUrl !== '') {
												const videoMatch = video.match(regex);
					       				const subMatch = subUrl.match(regex);

												if (videoMatch) {
												  const extractedString = videoMatch[1];
												  const fileCode = extractedString;

												  // console.log(fileCode);

												  fileCodeArray.push({ lang: i.lang, fileCode: fileCode, subUrl: '' });
												}

												if (subMatch) {
						       				const extractedString = subMatch[1];
													const subCode = extractedString;

						       				// console.log(subCode);

						       				fileCodeArray.forEach(i => {
						       					if (i.lang == lang) {
						       						i.subUrl = subCode;
						       					}
						       				});
						       			}
					       			}

					       			else {
												fileCodeArray.push({ lang: i.lang, fileCode: '', subUrl: '' });
					       			}
					       		});

					       		// console.log(fileCodeArray);

					       		Promise.all(fileCodeArray.map(i => {
										    const url1 = `https://uptobox.com/api/streaming?token=45701da784b02110e845cb7b8a8872577d32q&file_code=${i.fileCode}`;
										    const url2 = `https://uptobox.com/api/link?token=45701da784b02110e845cb7b8a8872577d32q&file_code=${i.subUrl}`

										    const opt3 = {
										      'method': 'GET',
										      'headers': {
					    							accept: 'application/json',
										      }
										    };

										    const axiosPromise1 = axios.get(url1, opt3) // Pass your options object as the second argument
									        .then(response => {
									        		// console.log(response.data);
									            // Assuming the response contains JSON data
									            return { ...response.data, lang: i.lang };
									        })
									        .catch(error => {
									            console.log(error);
									            // Handle the error as needed
									            // return { error: 'An error occurred' }; // You can return an error object or some default value
									        });

									      const axiosPromise2 = axios.get(url2, opt3) // Add this axios.get call
									        .then(response => {
									            // Assuming the response contains JSON data
									            return { ...response.data, lang: i.lang };
									        })
									        .catch(error => {
									            console.log(error);
									            // Handle the error as needed
									            // return { error: 'An error occurred' }; // You can return an error object or some default value
									        });

									      return Promise.all([axiosPromise1, axiosPromise2]);
										})).then(results => {
									    // console.log(results);

									    if (results.length > 2) {
									    	results.forEach(i => {
									    		// console.log(i);
									    		i.forEach(j => {
									    			// console.log(j);

									    			let videoUrl = '';
									    			let videoLang = '';
									    			let subUrl = '';

									    			if (j.statusCode === 0) {
									    				if (j.data.hasOwnProperty('streamLinks')) {
										    				videoUrl = j.data.streamLinks.src;
											    			videoLang = j.lang;
										    				videoArray.push({ lang: videoLang, url: videoUrl, subUrl: subUrl });
											    		}

											    		if (j.data.hasOwnProperty('dlLink')) {
										    				subUrl = j.data.dlLink;

										    				videoArray.forEach(k => {
										    					if (k.lang == j.lang) {
										    						k.subUrl = subUrl;
										    					}
										    				})
											    		}
									    			}
									    			else {
										    			videoArray.push({ lang: j.lang, url: '', subUrl: '' });
										    		}
									    		})
									    	})
									    }

									    else {
									    	results.forEach(i => {
									    		i.forEach(j => {
									    			// console.log(j);
									    			if (j.statusCode === 0) {
									    				let videoUrl = '';
									    				let videoLang = '';
									    				let subUrl = '';
									    				
									    				if (j.data.hasOwnProperty('streamLinks')) {
										    				videoUrl = j.data.streamLinks.src;
											    			videoLang = j.lang;
										    				videoArray.push({ lang: videoLang, url: videoUrl, subUrl: subUrl });
											    		}

											    		if (j.data.hasOwnProperty('dlLink')) {
										    				subUrl = j.data.dlLink;

										    				videoArray.forEach(k => {
										    					if (k.lang == j.lang) {
										    						k.subUrl = subUrl;
										    					}
										    				})
											    		}
										    		}
										    		else {
											    		videoArray.push({ lang: j.lang, url: '', subUrl: '' });
										    		}
									    		})
									    	})
										  }

									    // console.log(langArray);

									    const uniqueArray = videoArray.filter((item, index, self) =>
											  index === self.findIndex((t) => t.lang === item.lang)
											);

											// console.log(uniqueArray);

									    return res.json({
												isSuccess: true,
												langArray: langArray,
												videoUrl: uniqueArray,
												errorMessage: ""
											})
										});				        	
					       	}

					       	else {
					        	return res.json({
											isSuccess: false,
											langArray: [],
											videoUrl: [],
											errorMessage: "No data found..."
										})
					       	}
					      }
							})
						}
						else {
							return res.json({
								isSuccess: false,
								langArray: [],
								videoUrl: [],
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
				langArray: [],
				videoUrl: [],
				errorMessage: "No data found..."
			})
		}
})

module.exports = router;
