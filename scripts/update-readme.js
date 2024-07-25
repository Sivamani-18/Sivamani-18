import { graphql } from "@octokit/graphql";
import { execSync } from "child_process";
import fs from "fs";
import process from "process"; // Ensure process is imported

const token = process.env.GH_TOKEN;
const username = "Sivamani-18";

const query = `
  {
    user(login: "${username}") {
      contributionsCollection {
        commitContributionsByRepository(maxRepositories: 5) {
          repository {
            name
            url
          }
          contributions(last: 5) {
            committedDate
            commit {
              messageHeadline
              commitUrl
            }
          }
        }
      }
    }
  }
`;

async function updateReadme() {
  try {
    const result = await graphql(query, {
      headers: {
        authorization: `token ${token}`,
      },
    });

    console.log("GraphQL query result:", result);

    let activity = "";
    result.user.contributionsCollection.commitContributionsByRepository.forEach((repo) => {
      activity += `### [${repo.repository.name}](${repo.repository.url})\n`;
      repo.contributions.forEach((contribution) => {
        const date = new Date(contribution.committedDate);
        activity += `- ${date.toDateString()}: [${contribution.commit.messageHeadline}](${contribution.commit.commitUrl})\n`;
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

    console.log("README updated and changes pushed successfully.");
  } catch (error) {
    console.error("Error updating README:", error);
  }
}

updateReadme();
