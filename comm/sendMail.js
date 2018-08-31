const config              = require('../conf/config.js');

const aws = require('aws-sdk');
const ses = new aws.SES({
  "accessKeyId":      process.env.EMAIL_ACCKEYID,
  "secretAccessKey":  process.env.EMAIL_SECACCKEY,
  "region":           config.email.region
});


function promisefy(func, paras){
  return new Promise(function(success, fail){
    function _cb(err, result){
      if(err){
        fail(err);
      } else {
        success(result);
      }
    }
    paras.push(_cb);
    func.apply(ses, paras);
  });
}

const sendMail = (to, subject,message) => {
  const params = {
    Destination: {
      ToAddresses: [to]
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: message
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    ReturnPath:   config.email.sender,
    Source:       config.email.sender
  };
  return promisefy(ses.sendEmail, [params]);
};
module.exports = sendMail;
