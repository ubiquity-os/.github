/**
 * Plugin Health Monitor for UbiquityOS
 * Monitors repositories in @ubiquity-os-marketplace for 10 consecutive failures
 * from manual dispatches by authorized apps.
 */
module.exports = async ({ github, context, core }) => {
  const org = 'ubiquity-os-marketplace';
  const actors = ['ubiquity-os[bot]', 'gentlementlegen'];
  const failureThreshold = 10;
  const targetIssue = {
    owner: 'ubiquity-os',
    repo: '.github',
    issue_number: 12
  };

  core.info(`Starting health check for organization: ${org}`);

  try {
    const repos = await github.paginate(github.rest.repos.listForOrg, {
      org,
      type: 'public',
    });

    core.info(`Found ${repos.length} repositories. Scanning...`);

    const healthIssues = [];

    for (const repo of repos) {
      if (repo.name === '.github') continue;

      // Fetch manual dispatch runs for the repository from authorized actors
      for (const actor of actors) {
        const runsResponse = await github.rest.actions.listWorkflowRunsForRepo({
          owner: org,
          repo: repo.name,
          actor: actor,
          event: 'workflow_dispatch',
          status: 'completed',
          per_page: failureThreshold,
        });

        const runs = runsResponse.data.workflow_runs;
        
        if (runs.length >= failureThreshold) {
          const consecutiveFailures = runs.every(run => run.conclusion === 'failure');

          if (consecutiveFailures) {
            core.warning(`Health issue detected in ${repo.name} (Actor: ${actor}): 10 consecutive failures.`);
            healthIssues.push({
              name: repo.name,
              actor: actor,
              url: repo.html_url,
              latestFailureUrl: runs[0].html_url,
              count: runs.length
            });
            // Skip further actors for this repo if one is already failing 10 times
            break;
          }
        }
      }
    }

    if (healthIssues.length > 0) {
      core.info(`Reporting ${healthIssues.length} health issues...`);
      
      let commentBody = "### 🚨 UbiquityOS Plugin Health Alert\n\n";
      commentBody += "The following plugins have encountered **10 consecutive failures** from manual dispatches (UbiquityOS App / Maintainers):\n\n";
      
      for (const issue of healthIssues) {
        commentBody += `- **[${issue.name}](${issue.url})**: [View Latest Failed Run](${issue.latestFailureUrl})\n`;
      }
      
      commentBody += "\n**Action Required**: Please investigate these plugins to ensure they are functioning correctly.\n\n";
      commentBody += "CC: @ubiquity-os @gentlementlegen";

      await github.rest.issues.createComment({
        ...targetIssue,
        body: commentBody,
      });

      core.info("Comment posted successfully.");
    } else {
      core.info("All plugins are healthy.");
    }

  } catch (error) {
    core.setFailed(`Health monitor failed: ${error.message}`);
  }
};
