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

      // Fetch workflow runs for the repository
      const runsResponse = await github.rest.actions.listWorkflowRunsForRepo({
        owner: org,
        repo: repo.name,
        per_page: 50,
      });

      const runs = runsResponse.data.workflow_runs;
      
      // Filter for manual dispatches from authorized actors that have completed
      const relevantRuns = runs.filter(run => 
        actors.includes(run.actor.login) && 
        run.event === 'workflow_dispatch' &&
        run.status === 'completed'
      );

      if (relevantRuns.length >= failureThreshold) {
        const recentRuns = relevantRuns.slice(0, failureThreshold);
        const consecutiveFailures = recentRuns.every(run => run.conclusion === 'failure');

        if (consecutiveFailures) {
          core.warning(`Health issue detected in ${repo.name}: 10+ consecutive failures.`);
          healthIssues.push({
            name: repo.name,
            url: repo.html_url,
            latestFailureUrl: recentRuns[0].html_url,
            count: recentRuns.length
          });
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
