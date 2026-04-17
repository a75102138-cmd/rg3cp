describe('Plateforme patrimoniale - Smoke suite', () => {
  const projectName = `TEST Projet Cypress ${Date.now()}`
  const zoneName = `TEST Zone ${Date.now()}`
  const elementName = `TEST Element ${Date.now()}`
  const observationTitle = `TEST Observation ${Date.now()}`

  const userEmail = 'admin@g3c.local'
  const userPassword = 'ChangeMe123!'

  beforeEach(() => {
    cy.viewport(1440, 900)
  })

  function login() {
    cy.visit('http://localhost:3000/login')

    // adapte les selectors si besoin
    cy.get('input[name="email"], input[type="email"]').first().clear().type(userEmail)
    cy.get('input[name="password"], input[type="password"]').first().clear().type(userPassword, {
      log: false,
    })

    cy.contains(/se connecter|connexion|login/i).click()

    // attendre l'entrée dans l'app
    cy.url().should('not.include', '/login')
  }

  it('se connecte à la plateforme', () => {
    login()
    cy.contains(/tableau de bord|projets|g3c patrimoine/i).should('be.visible')
  })

  it('ouvre la page Projets depuis la sidebar après login', () => {
    login()

    cy.contains(/projets/i).click({ force: true })
    cy.url().should('include', '/projects')
    cy.contains(/projets/i).should('be.visible')
  })

  it('crée un projet', () => {
    login()

    cy.contains(/projets/i).click({ force: true })

    cy.contains(/ajouter|nouveau|créer/i).click()

    cy.get('input[name="name"]').type(projectName)
    cy.get('input[name="location"]').type('Tinmel')
    cy.get('input[name="startDate"]').type('2026-04-07')

    cy.get('textarea[name="description"]').then(($el) => {
      if ($el.length) cy.wrap($el).type('Projet de test Cypress')
    })

    cy.get('select[name="status"]').then(($el) => {
      if ($el.length) cy.wrap($el).select(1)
    })

    cy.contains(/enregistrer|créer/i).click()

    cy.contains(projectName).should('be.visible')
  })

  it('ouvre le détail du projet créé', () => {
    login()

    cy.contains(/projets/i).click({ force: true })
    cy.contains(projectName).click({ force: true })

    cy.contains(projectName).should('be.visible')
  })

  it('crée une zone dans le projet', () => {
    login()

    cy.contains(/projets/i).click({ force: true })
    cy.contains(projectName).click({ force: true })

    // depuis le projet, ouvrir le flux zones
    cy.contains(/zones/i).click({ force: true })
    cy.contains(/ajouter une zone|ajouter|nouvelle zone/i).click({ force: true })

    cy.get('input[name="name"]').type(zoneName)
    cy.get('select[name="type"]').select(1)

    cy.get('select[name="heritageSensitivity"]').then(($el) => {
      if ($el.length) cy.wrap($el).select(1)
    })

    cy.get('textarea[name="description"]').then(($el) => {
      if ($el.length) cy.wrap($el).type('Zone créée par Cypress')
    })

    cy.contains(/enregistrer|créer/i).click()
    cy.contains(zoneName).should('be.visible')
  })

  it('ouvre le détail de la zone créée', () => {
    login()

    cy.contains(/projets/i).click({ force: true })
    cy.contains(projectName).click({ force: true })
    cy.contains(/zones/i).click({ force: true })
    cy.contains(zoneName).click({ force: true })

    cy.contains(zoneName).should('be.visible')
  })

  it('crée un élément dans la zone', () => {
    login()

    cy.contains(/projets/i).click({ force: true })
    cy.contains(projectName).click({ force: true })
    cy.contains(/zones/i).click({ force: true })
    cy.contains(zoneName).click({ force: true })

    cy.contains(/éléments|elements/i).click({ force: true })
    cy.contains(/ajouter un élément|ajouter|nouvel élément/i).click({ force: true })

    cy.get('input[name="name"]').type(elementName)
    cy.get('select[name="type"]').select(1)

    cy.get('textarea[name="description"]').then(($el) => {
      if ($el.length) cy.wrap($el).type('Élément créé par Cypress')
    })

    cy.contains(/enregistrer|créer/i).click()
    cy.contains(elementName).should('be.visible')
  })

  it('ouvre le détail de l’élément créé', () => {
    login()

    cy.contains(/projets/i).click({ force: true })
    cy.contains(projectName).click({ force: true })
    cy.contains(/zones/i).click({ force: true })
    cy.contains(zoneName).click({ force: true })
    cy.contains(/éléments|elements/i).click({ force: true })
    cy.contains(elementName).click({ force: true })

    cy.contains(elementName).should('be.visible')
    cy.contains(/fiche élément|élément/i).should('be.visible')
  })

  it('crée une observation dans l’élément', () => {
    login()

    cy.contains(/projets/i).click({ force: true })
    cy.contains(projectName).click({ force: true })
    cy.contains(/zones/i).click({ force: true })
    cy.contains(zoneName).click({ force: true })
    cy.contains(/éléments|elements/i).click({ force: true })
    cy.contains(elementName).click({ force: true })

    cy.contains(/ajouter une observation|ajouter|nouvelle observation/i).click({ force: true })

    cy.get('input[name="title"]').type(observationTitle)
    cy.get('textarea[name="description"]').type('Observation créée par Cypress')

    cy.get('select[name="type"]').select(1)
    cy.get('select[name="severity"]').select(1)

    // ancien mode texte
    cy.get('input[name="authorName"]').then(($el) => {
      if ($el.length) cy.wrap($el).type('Cypress Test')
    })

    // nouveau mode actor select
    cy.get('select[name="authorActorId"]').then(($el) => {
      if ($el.length && $el.find('option').length > 1) cy.wrap($el).select(1)
    })

    cy.contains(/enregistrer|créer/i).click()
    cy.contains(observationTitle).should('be.visible')
  })

  it('vérifie la navigation de base dans la sidebar après login', () => {
    login()

    cy.contains(/projets/i).click({ force: true })
    cy.contains(/zones/i).click({ force: true })
    cy.contains(/journal/i).click({ force: true })
    cy.contains(/documents/i).click({ force: true })
    cy.contains(/médias|medias|médiathèque/i).click({ force: true })
    cy.contains(/risques/i).click({ force: true })
  })
})