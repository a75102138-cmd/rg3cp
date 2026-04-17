describe("Plateforme patrimoniale - CRUD/Validation/Navigation", () => {
  const env = (Cypress.config("env") ?? {}) as Record<string, string>;
  const baseUrl = "http://localhost:3000";
  const apiBaseUrl = env.API_BASE_URL || "http://localhost:3001/api";
  const email = env.E2E_EMAIL || "admin@g3c.local";
  const password = env.E2E_PASSWORD || "ChangeMe123!";

  beforeEach(() => {
    cy.viewport(1440, 900);
  });

  function login() {
    cy.request({
      method: "POST",
      url: `${apiBaseUrl}/auth/login`,
      body: { email, password },
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status, "auth/login status").to.be.oneOf([200, 201]);
      const accessToken = resp.body?.accessToken as string | undefined;
      expect(accessToken, "accessToken from login").to.be.a("string").and.not.empty;
      cy.setCookie("g3c_token", accessToken!, { path: "/" });
    });
    cy.visit(baseUrl);
    cy.url({ timeout: 10000 }).should("not.include", "/login");
  }

  function openCreateButton() {
    cy.contains(/ajouter|nouveau|nouvelle|créer|create/i).first().click({ force: true });
  }

  function inDialog(cb: () => void) {
    cy.get('[role="dialog"]').last().should("be.visible").within(cb);
  }

  function openProjects() {
    cy.visit(`${baseUrl}/projects`);
    cy.url().should("include", "/projects");
  }

  function createProjectAndOpenDetail(projectName: string) {
    openProjects();
    cy.contains(/ajouter un projet/i).click({ force: true });
    inDialog(() => {
      cy.get('input[name="name"], input#name').first().type(projectName);
      cy.get('input[name="location"], input#location').first().type("Tinmel");
      cy.get('input[name="startDate"], input[type="date"]').first().type("2026-04-07");
      cy.contains(/enregistrer|créer|create/i).click({ force: true });
    });
    cy.contains(projectName).should("be.visible").click({ force: true });
    cy.url().should("match", /\/projects\/[^/]+/);
  }

  it("navigation - accès auth + page projets", () => {
    login();
    cy.visit(`${baseUrl}/projects`);
    cy.url().should("not.include", "/login");
    cy.contains(/projets patrimoniaux|projets/i).should("be.visible");
  });

  it("navigation métier - Project -> Zone -> Journal/Documents/Media/Risks -> Intervention", () => {
    const run = Date.now();
    const flow = {
      project: `FLOW Project ${run}`,
      zone: `FLOW Zone ${run}`,
      element: `FLOW Element ${run}`,
      observation: `FLOW Observation ${run}`,
      pathology: `FLOW Pathology ${run}`,
      decision: `FLOW Decision ${run}`,
      intervention: `FLOW Intervention ${run}`,
    };

    login();
    createProjectAndOpenDetail(flow.project);

    // Navigate inside project context tabs/sections
    cy.contains(/zones/i).click({ force: true });
    cy.url().should("satisfy", (u: string) => u.includes("/projects/") || u.includes("/zones"));
    cy.contains(/journal/i).click({ force: true });
    cy.url().should("satisfy", (u: string) => u.includes("/projects/") || u.includes("/journal"));
    cy.contains(/documents/i).click({ force: true });
    cy.url().should("satisfy", (u: string) => u.includes("/projects/") || u.includes("/documents"));
    cy.contains(/médias|medias|media/i).click({ force: true });
    cy.url().should("satisfy", (u: string) => u.includes("/projects/") || u.includes("/media"));
    cy.contains(/risques/i).click({ force: true });
    cy.url().should("satisfy", (u: string) => u.includes("/projects/") || u.includes("/risks"));
    cy.contains(/zones/i).click({ force: true });

    // Create zone + open zone detail
    cy.contains(/ajouter une zone/i).first().click({ force: true });
    inDialog(() => {
      cy.get('input#z-name, input[name="name"], input:not([type="file"])').first().type(flow.zone);
      cy.contains(/enregistrer|créer/i).click({ force: true });
    });
    cy.contains(flow.zone).click({ force: true });
    cy.url().should("match", /\/zones\/[^/]+/);

    // Navigate inside zone
    cy.contains(/éléments|elements/i).click({ force: true });
    cy.url().should("match", /\/zones\/[^/]+/);
    cy.contains(/documents/i).click({ force: true });
    cy.url().should("match", /\/zones\/[^/]+/);
    cy.contains(/médias|medias|media/i).click({ force: true });
    cy.url().should("match", /\/zones\/[^/]+/);
    cy.contains(/risques/i).click({ force: true });
    cy.url().should("match", /\/zones\/[^/]+/);
    cy.contains(/éléments|elements/i).click({ force: true });

    // Create element
    cy.contains(/ajouter un élément|ajouter un element/i).first().click({ force: true });
    inDialog(() => {
      cy.get('input:not([type="file"])').first().type(flow.element);
      cy.contains(/enregistrer|créer/i).click({ force: true });
    });
    cy.contains(flow.element).click({ force: true });
    cy.url().should("match", /\/elements\/[^/]+/);

    // Create observation
    cy.contains(/ajouter.*observation|nouvelle observation|ajouter/i).first().click({ force: true });
    inDialog(() => {
      cy.get("textarea").first().type(flow.observation);
      cy.contains(/enregistrer|créer/i).click({ force: true });
    });
    cy.contains(flow.observation).click({ force: true });
    cy.url().should("match", /\/observations\/[^/]+/);

    // Create pathology
    cy.contains(/patholog/i).first().click({ force: true });
    cy.contains(/ajouter une pathologie|nouvelle pathologie|ajouter/i).first().click({ force: true });
    inDialog(() => {
      cy.get('input:not([type="file"])').first().type(flow.pathology);
      cy.contains(/enregistrer|créer/i).click({ force: true });
    });
    cy.contains(flow.pathology).should("be.visible");

    // Create decision
    cy.contains(/décision|decision/i).first().click({ force: true });
    cy.contains(/nouvelle décision|nouvelle decision|ajouter une décision|ajouter une decision|ajouter/i).first().click({ force: true });
    inDialog(() => {
      cy.get('input:not([type="file"])').first().type(flow.decision);
      cy.contains(/enregistrer|créer/i).click({ force: true });
    });
    cy.contains(flow.decision).click({ force: true });
    cy.url().should("match", /\/decisions\/[^/]+/);

    // Create intervention
    cy.contains(/intervention/i).first().click({ force: true });
    cy.contains(/nouvelle intervention|ajouter une intervention|ajouter/i).first().click({ force: true });
    inDialog(() => {
      cy.get("textarea").first().type(flow.intervention);
      cy.contains(/enregistrer|créer/i).click({ force: true });
    });
    cy.contains(flow.intervention).should("be.visible");
  });

  it("validation - create project requires name", () => {
    login();
    openProjects();
    openCreateButton();
    inDialog(() => {
      cy.get('input[name="name"], input#name').first().clear();
      cy.contains(/enregistrer|créer|create/i).click({ force: true });
    });
    cy.contains(/obligatoire|required|requis/i).should("be.visible");
  });

  it("create flow - Project", () => {
    const projectName = `CYP Project ${Date.now()}`;
    login();
    createProjectAndOpenDetail(projectName);
    cy.contains(projectName).should("be.visible");
  });

  it("edit/delete flow - Zone (dans son détail)", () => {
    const run = Date.now();
    const projectName = `CRUD Zone Project ${run}`;
    const zoneName = `CRUD Zone ${run}`;
    const zoneUpdated = `CRUD Zone Updated ${run}`;

    login();
    createProjectAndOpenDetail(projectName);

    // Create zone
    cy.contains(/zones/i).first().click({ force: true });
    cy.contains(/ajouter une zone/i).first().click({ force: true });
    inDialog(() => {
      cy.get('input#z-name, input[name="name"], input:not([type="file"])').first().type(zoneName);
      cy.contains(/enregistrer|créer/i).click({ force: true });
    });
    cy.contains(zoneName).click({ force: true });
    cy.url().should("match", /\/zones\/[^/]+/);

    // Edit zone
    cy.contains(/modifier|éditer|edit/i).first().click({ force: true });
    inDialog(() => {
      cy.get('input#z-name, input[name="name"], input:not([type="file"])').first().clear().type(zoneUpdated);
      cy.contains(/enregistrer/i).click({ force: true });
    });
    cy.contains(zoneUpdated).should("be.visible");

    // Delete zone
    cy.contains(/supprimer/i).first().click({ force: true });
    inDialog(() => {
      cy.contains(/supprimer/i).last().click({ force: true });
    });
    cy.url().should("include", "/projects/");
  });

  it("validation - observation photo upload requires phase/type/files", () => {
    const run = Date.now();
    const flow = {
      project: `VAL Project ${run}`,
      zone: `VAL Zone ${run}`,
      element: `VAL Element ${run}`,
      observation: `VAL Observation ${run}`,
    };

    login();
    createProjectAndOpenDetail(flow.project);
    cy.contains(/zones/i).click({ force: true });
    cy.contains(/ajouter une zone/i).first().click({ force: true });
    inDialog(() => {
      cy.get('input#z-name, input[name="name"], input:not([type="file"])').first().type(flow.zone);
      cy.contains(/enregistrer|créer/i).click({ force: true });
    });
    cy.contains(flow.zone).click({ force: true });
    cy.contains(/éléments|elements/i).click({ force: true });
    cy.contains(/ajouter un élément|ajouter un element/i).first().click({ force: true });
    inDialog(() => {
      cy.get('input:not([type="file"])').first().type(flow.element);
      cy.contains(/enregistrer|créer/i).click({ force: true });
    });
    cy.contains(flow.element).click({ force: true });
    cy.contains(/ajouter.*observation|nouvelle observation|ajouter/i).first().click({ force: true });
    inDialog(() => {
      cy.get("textarea").first().type(flow.observation);
      cy.contains(/enregistrer|créer/i).click({ force: true });
    });
    cy.contains(flow.observation).click({ force: true });

    cy.contains(/photos/i).click({ force: true });
    cy.contains(/ajouter des photos/i).click({ force: true });
    inDialog(() => {
      cy.contains(/enregistrer/i).click({ force: true });
    });
    cy.contains(/obligatoire|sélectionnez|choisissez/i).should("be.visible");
  });
});

