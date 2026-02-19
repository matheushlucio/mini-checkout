function tempoResposta(req, res, next) {
  const inicio = Date.now();

  res.on('finish', () => {
    const tempo = Date.now() - inicio;
    console.log(`${req.method} ${req.url} - ${tempo}ms`);
  });

  next();
}

module.exports = tempoResposta;
