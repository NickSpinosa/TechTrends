var request = require('request');
var rp = require('request-promise');
var server = null;
var chai = require('chai');
var expect = chai.expect;
var Promise = require('bluebird');
var _ = require('underscore');

//if debug is true the tests are run after starting the server, so vscode can attach to the server
if(!process.env.debug && !process.env.heroku){
  
  var target = process.env.target;
  var app = require(target);
} 
if(process.env.heroku){
  server = 'https://arcane-ravine-35587.herokuapp.com'
} else {
  server = 'http://127.0.0.1:8000';
}
console.log('heroku is',process.env.heroku);
console.log('server is',server);
describe('raw-postings',function(){

//the first three have the same date, the last two have a different date
var postingsExamples = [{"date": 100, "name": "A"},
                        {"date": 100,"name":"B"},
                        {"date": 100, "name": "C"},
                        {"date": 101,"name":"D"},
                        {"date": 102,"name":"E"}];
 
var postA = function(){
  return rp.post(server+'/raw-postings',{json: postingsExamples[0]});
}

var postB= function(){
  return rp.post(server+'/raw-postings',{json: postingsExamples[1]});
}

var postC= function(){
  return rp.post(server+'/raw-postings',{json: postingsExamples[2]});
}

//the post with a unique date
var postD = function(){
  return rp.post(server+'/raw-postings',{json: postingsExamples[3]});
}

var postE = function(){
  return rp.post(server+'/raw-postings',{json: postingsExamples[4]});
}

//api descriptions here
var deleteall = function(){return rp.delete(server+'/raw-postings/?date=0');};
var deleteone = function(){return rp.delete(server+'/raw-postings/?date=101');};
var getall = function(){return rp.get(server+'/raw-postings?date=0');};
var getone = function(){return rp.get(server+'/raw-postings?date=101');};
var getlength = function(){return rp.get(server+'/raw-postings?date=100&index=-1');};
var zeroelement = function(){return rp.get(server+'/raw-postings?date=100&index=0');};
var firstelement = function(){return rp.get(server+'/raw-postings?date=100&index=1');};
var secondelement = function(){return rp.get(server+'/raw-postings?date=100&index=2');};
var getallDates = function(){return rp.get(server+'/raw-postings/dates');};

//todo: var nthelement = function(n){return rp.get(server+`/raw-postings?date=100&index=${n}`);};

//setup
beforeEach(function(done){
  //console.log('deleting raw')
  deleteall().then(res=>{
    done();
  });
})

//testing
describe ('service of static assets',function(){
  it('serves index',function(done){
    request(server+'/').on('response',function(res){
      expect(res.statusCode).to.equal(200);
      done();
    })
  });
});

describe('raw-postings post request',function(){

  it('posts with statusCode of 202',function(done){
      postA()
        .on('response',response=>{
          expect(response.statusCode).to.equal(202);
          done();
        });
    });
    
  it('returns the posted object from a post request',function(done){
      postA()
        .then(response=>{
          expect(response.name).to.equal('A');
        })
        .then(done)            
        .catch(done);
    });

});

describe('raw-postings get request',function(){

  it('gets postings with statusCode of 202',function(done){
    getall()
      .on('response',response=>{
        expect(response.statusCode).to.equal(202);
        done();
      });
  });

  it('returns an array of date lists',function(done){
    postA()
      .then(getall)
      .then(response=>{
        var res = JSON.parse(response);
        expect(Array.isArray(res)).to.equal(true);
      })
      //.then>.catch provides expected and actual results in case of failure
      .then(done)     
      .catch(done)
  });

  it('returns an array of one date-list',function(done){
    postD()
      .then(getone)
      .then(response=>{
        var res = JSON.parse(response);
        expect(Array.isArray(res)).to.equal(true);
      })
      .then(done)
      .catch(done);
  });

  it('gets one date-list by date',function(done){
    postA()
      .then(postB)
      .then(postD)
      .then(getone)
      .then((response)=>{
        var res = JSON.parse(response);
        expect(res.length).to.equal(1);
        expect(res[0].postings.length).to.equal(1);
      })
      .then(done)
      .catch(done);
  })

  it('returned datelists expose a postings property which is an array',function(done){
    postA()
      .then(postB)
      .then(postC)
      .then(getall)
      .then((response)=>{
        var res = JSON.parse(response);
        expect(res[0].postings);
        expect(Array.isArray(res[0].postings));
      })
      .then(done)
      .catch(done);
  })

  it('returns all date-lists',function(done){
    postA()
      .then(getall)
      .then(response=>{
        var res = JSON.parse(response);
        expect(res[0].postings[0].name).to.equal('A');
      })
      .then(done)
      .catch(done)
  });

});

describe('raw-postings getalldates request',function(){

  it('returns all dates on a request',function(done){
    postA()
    .then(postD)
    .then(postE)
    .then(getallDates)
    .then(response =>{
      var res = JSON.parse(response);
      expect(res.length).to.equal(3);
      expect(res[0]).to.equal('100');
      expect(res[1]).to.equal('101');
    })
    .then(done)
    .catch(done);

  })

});

describe('raw-postings delete request',function(){
  
  it('deletes postings with statusCode of 204',function(done){
    deleteall()
      .on('response',response=>{
        expect(response.statusCode).to.equal(204);
        done();
      });
  });

  it('deletes one datelist by date',function(done){
    postA()
      .then(postB)
      .then(postD)
      .then(deleteone)
      .then(getall)
      .then((response)=>{
        var res = JSON.parse(response);
        expect(res.length).to.equal(1);
        expect(res[0].postings[0].name).to.equal('A');
      })
      .then(done)
      .catch(done);
  });

  it('deletes all posts',function(done){
    postA()
      .then(postB)
      .then(deleteall)
      .then(getall)
      .then((response)=>{
        expect(JSON.parse(response).length).to.equal(0);
      })
      .then(done)
      .catch(done);
  });

});

describe('raw-postings database behavior',function(){

  it('adds multiple posts of the same date to the same list of postings',function(done){
    postA()
      .then(postB)
      .then(getall)
      .then((response)=>{
        expect(JSON.parse(response).length).to.equal(1);
        var res = JSON.parse(response);
        expect(res[0].postings.length).to.equal(2);
      })
      .then(done)
      .catch(done);
  });

  it('adds multiple posts of a different date to different lists of postings',function(done){
    postA()
      .then(postB)
      .then(postD)
      .then(getall)
      .then((response)=>{
        var res = JSON.parse(response);
        expect(res.length).to.equal(2);
        expect(res[0].postings.length).to.equal(2);
        expect(res[1].postings.length).to.equal(1);
      })
      .then(done)
      .catch(done);
  });

  it('returns the length of the datelist',function(done){
    postA()
      .then(postB)
      .then(postC)
      .then(getlength)
      .then((response)=>{
        //console.log('response from server',response);
        expect(response).to.equal('3');
      })
      .then(done)
      .catch(done);
  });

  it('iterates postings in a datelist',function(done){
    postA()
      .then(postB)
      .then(postC)
      .then(zeroelement)
      .then((response)=>{
        var res = JSON.parse(response);
        expect(res.name).to.equal('A');
      })
      .then(firstelement)
      .then((response)=>{
        var res = JSON.parse(response);
        expect(res.name).to.equal('B');
      })
      .then(secondelement)
      .then((response)=>{
        var res = JSON.parse(response);
        expect(res.name).to.equal('C');
      })
      .then(done)
      .catch(done);
  });

});

}); //end of raw-postings describe

describe('analyzed',function(){

  console.log('server is',server);
  var deleteallAnalyzed = function(){return rp.delete(server+'/analyzed-data/?hub=0')};

  var analytics = require('./testAnalytics.json');
  var ascendingHub = analytics[0];
  var descendingHub = analytics[1];
  var ascendingHubv2 = analytics[2];

  var getoneAnalyzed = function(){return rp.get(server+'/analyzed-data?hub=San%20Francisco&viewName=javascriptFrameworks');};
  
  var getviews = function(){
    return rp.get(server+'/analyzed-data/views');
  };

  var postAnalyzedA0 = function(){
    return rp.post(server+'/analyzed-data',{json: ascendingHub[0]});
  }

  var postAnalyzedA1 = function(){
    return rp.post(server+'/analyzed-data',{json: ascendingHub[1]});
  }
  
  var postAnalyzedD0= function(){
    return rp.post(server+'/raw-postings',{json: descendingHub[0]});
  }

  var pospostAnalyzedD1= function(){
    return rp.post(server+'/raw-postings',{json: descendingHub[1]});
  }

  var postAnalyzedA0V2= function(){
    return rp.post(server+'/raw-postings',{json: ascendingHubv2[0]});
  }

    

    describe('analyzed-data post request',function(){
      
      // beforeEach(function(done){
      //   //console.log('deleting analyzed');
      //   deleteallAnalyzed().then(res=>{
      //     done();
      //   });
      // })

      xit('posts with statusCode of 201',function(done){
          postAnalyzedA0()
            .on('response',response=>{
              expect(response.statusCode).to.equal(201);
              done();
            });
        });

      xit('gets with statusCode of 200',function(done){
          postAnalyzedA0()
          .then(function(){
            getoneAnalyzed()
            .on('response',response=>{
              expect(response.statusCode).to.equal(200);
              done();
            });
        });
      });

      xit('returns an array of date/hub data points on a get request',function(done){
          postAnalyzedA0()
          .then(postAnalyzedA1)
          .then(getoneAnalyzed)
          .then(function(response){
            var res = JSON.parse(response);
            expect(res.length).to.equal(2);
          })
          .then(done)
          .catch(done);
        });

        xit('returns a list of views',function(done){
          postAnalyzedA0()
          .then(postAnalyzedA0V2)
          .then(getviews)
          .then(function(response){
            var res = JSON.parse(response);
            expect(res.length).to.equal(7);
            expect(res[0]).to.equal('javascriptFrameworks');
            expect(res[1]).to.equal('serverLanguages');
          })
          .then(done)
          .catch(done);
        });

        xit('adds all testdata to the database',function(done){
          this.timeout(300000);
          
          //deleteallAnalyzed().then(function(){
            for(var i = 0; i<ascendingHub.length; i++){
              var delay = i * 1000;
              console.log('i',i)
              setTimeout(function (ii){
                console.log('ii',ii);
                rp.post(server+'/analyzed-data',{json: ascendingHub[ii]});
                console.log('wrote',ascendingHub[ii]);
              }.bind(null,i),delay);
              if(i === ascendingHub.length){
                done();
              }
            }
              //rp.post(server+'/analyzed-data',{json: descendingHub[i]});
            //}
          //})
        });

    });
 
 

});