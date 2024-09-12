import shell from "shelljs";

// Ensure Open API scheme.
shell.cp("src/rest/v1/openapi.yml", "dist/rest/v1/");
