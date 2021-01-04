/* IMPORTATION */
const express = require('express');
const app = express();
var Twitter = require('twitter');
var CronJob = require('cron').CronJob;

/* CONNECTION TO TWITTER'S API */
var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  });  

/* BOT'S MAIN TASK : Find the most recent tweet, check multiple (author, quotes, number of replies) and send the reply. */ 
function mainTask (issue,reply,number){
  client.get('search/tweets', {q: issue, tweet_mode: "extended",}, function(error, tweets, response){ // Find the most recent tweets
    let tweetId_ = tweets.statuses[0].id_str; 
    let tweetAuthor_ = tweets.statuses[0].user.screen_name;
    if( !/word exclusion|or sentences/.test(tweets.statuses[0].full_text.replace(/[’"']+/g, ' ').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()) // Exclude words or expressions that could reverse the meaning of the tweet
        && tweets.statuses[0].user.screen_name != 'YourOwnTwitterAccount' // Exclusion of your own Twitter account
        && tweets.statuses[0].is_quote_status == false // Exclusion of RTs to avoid errors
        && !tweets.statuses[0].retweeted_status // Exclusion of RTs to avoid errors
      ){
        client.get('https://api.twitter.com/2/tweets?tweet.fields=public_metrics', { ids: tweets.statuses[0].id_str }, function(error, tweets, response){ 
          if(tweets.data[0].public_metrics.reply_count==0){ // Checking that no response has already been sent
            console.log(tweets.data[0])
              client.post('statuses/update', { 
              in_reply_to_status_id: tweetId_, status: '@' + tweetAuthor_ + ' ' + reply // Sending the response
            },
            function (err, tweets, res) {  
              console.log(number+') Answer sent!')         
            });      
          }else{ 
            console.log(number+') This tweet has already been answered.')
          }
        });  
      }else{ 
        console.log(number+') Positive regex.')
      }     
  });
};    
 
/* CRON */ 

new CronJob('*/10 * * * *', function() {
      
  // 1) Call the main function here and pass custom parameters
  let issue1 = '*' // Write the query with the search operators: https://developer.twitter.com/en/docs/twitter-api/v1/rules-and-filtering/search-operators
  let reply1 = '*' // Write the answer
  let number1 = 1; 
  mainTask(issue1, reply1, number1);
 
}, null, true, 'America/Los_Angeles'); 
  
process.on('uncaughtException', err => {})
   
module.exports = app;

