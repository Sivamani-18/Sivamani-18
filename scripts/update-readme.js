import { graphql } from "@octokit/graphql";
import { execSync } from "child_process";
import fs from "fs";

const token = process.env.GH_TOKEN;
const username = "Sivamani-18";

const query = `
  {
    user(login: "${username}") {
      contributionsCollection {
        commitContributionsByRepository(maxRepositories: 5) {
          contributions(last: 5) {
            nodes {
              commit {
                message
                url
                committedDate
              }
            }
            repository {
              name
              url
            }
          }
        }
      }
    }
  }
`;

graphql(query, {
  headers: {
    authorization: `token ${token}`,
  },
})
  .then((result) => {
    console.log("GraphQL query result:", result);

    let activity = "";
    result.user.contributionsCollection.commitContributionsByRepository.forEach((repo) => {
      activity += `### [${repo.repository.name}](${repo.repository.url})\n`;
      repo.contributions.nodes.forEach((commit) => {
        const date = new Date(commit.commit.committedDate);
        activity += `- ${date.toDateString()}: [${commit.commit.message}](${commit.commit.url})\n`;
      });
      activity += "\n";
    });

    console.log("Generated activity content:", activity);

    const readme = fs.readFileSync("README.md", "utf8");
    const newReadme = readme.replace(
      /<!--START_SECTION:activity-->[\s\S]*<!--END_SECTION:activity-->/,
      `<!--START_SECTION:activity-->\n${activity}<!--END_SECTION:activity-->`
    );
    fs.writeFileSync("README.md", newReadme);

    console.log("Updated README content:", newReadme);

    execSync("git config --global user.name 'github-actions[bot]'");
    execSync("git config --global user.email 'github-actions[bot]@users.noreply.github.com'");
    execSync("git add README.md");
    execSync("git commit -m 'Update README with recent activity'");
    execSync("git push");
  })
  .catch((error) => console.error(error));
