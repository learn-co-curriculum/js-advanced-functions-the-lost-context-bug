let configuration = {
  frontContent: "Happy Birthday, Odin One-Eye!",
  insideContent: "From Asgard to Nifelheim, you're the best all-father ever.\n\nLove,",
  closing: {
      "Thor": "Admiration, respect, and love",
      "Loki": "Your son"
  },
  signatories: [
      "Thor",
      "Loki"
  ]
}

let printCard = function() {
    console.log(this.frontContent)
    console.log(this.insideContent)

    this.signatories.forEach(signatory=>{
        let message = `${this.closing[signatory]}, ${signatory}`
        console.log(message)
    })
}

printCard.call(configuration)
