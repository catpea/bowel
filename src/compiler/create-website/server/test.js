require('should');
import app from './app';
const server = app.listen();
const request = require('supertest').agent(server);

describe('Blog', () => {
  after(() => {
    server.close();
  });

  describe('GET /', () => {
    it('should see title "Posts"', done => {
      request
      .get('/')
      .expect(200, (err, {should, text}) => {
        if (err) return done(err);
        should.be.html;
        text.should.include('<title>Posts</title>');
        done();
      });
    });

    it('should see 0 post', done => {
      request
      .get('/')
      .expect(200, (err, {should, text}) => {
        if (err) return done(err);

        should.be.html;
        text.should.include('<p>You have <strong>0</strong> posts!</p>');
        done();
      });
    });
  });

  describe('POST /post/new', () => {
    it('should create post and redirect to /', done => {
      request
      .post('/post')
      .send({title: 'Title', body: 'Contents'})
      .end((err, {header}) => {
        if (err) return done(err);

        header.location.should.be.equal('/');
        done();
      });
    });
  });

  describe('GET /post/0', () => {
    it('should see post', done => {
      request
      .get('/post/0')
      .expect(200, (err, {should, text}) => {
        if (err) return done(err);

        should.be.html;
        text.should.include('<h1>Title</h1>');
        text.should.include('<p>Contents</p>');
        done();
      });
    });
  });
});
