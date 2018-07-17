const elasticsearch = require('elasticsearch');
const client = elasticsearch.Client({
	host: '127.0.0.1:9200',
	log: 'info'
});

client.ping({
	requestTimeout: 30000,

}, function(err) {
	if(err) {
		console.log("Elasticsearch cluster is down!");
	} else {
		console.log("Elasticsearch cluster is up!")
	}
});

function getAllGames() {
	var hits = [];
	return client.search({
		index: 'steam',
		type: 'game',
		body: {
			query: { match_all: {}}
		}
	}).then(function(res){
		for(var i = 0; i < res.hits.hits.length; ++i) {
			hits.push(res.hits.hits[i]._source);
		}
		return res;
	}).catch(function(err){
		console.log(err);
	});
}
exports.getAllGames = getAllGames;

function getGames(gameName) {
	var hits = [];
	return client.search({
		index: 'steam',
		type: 'game',
		body: {
			query: { match: { name: gameName }}
		}
	}).then(function(res){
		for(var i = 0; i < res.hits.hits.length; ++i) {
			hits.push(res.hits.hits[i]._source);
		}
		return res;
	}).catch(function(err){
		console.log(err);
	});
}
exports.getGames = getGames;