
const core = require('@actions/core')
const {createGitHubClient} = require("../lib/utils")
const main = async () => {
    try {
        const config = parseInput()

        core.info('Creating GitHub Client')
        const octokit = createGitHubClient(config.token)

        core.info(`[${config.repo}]: Retrieving mono-repo allowlist`)
        const allowlist = await getFileArray(octokit, config.org, config.allowlist_repo, config.allowlist_path)

        core.info(`[${config.repo}]: Validating repo has access to monorepo features`)
        if (!allowlist.includes(config.repo)) {
            core.setFailed(`[${config.repo}]: Configuration not allowed, repo not enabled for monorepo features, please add to allowlist: https://github.com/${config.allowlist_repo}/blob/main/${config.allowlist_path}`)
        }
    } catch (e) {
        core.setFailed(`Unable to upload database: ${e.message}`)
    }
}

const parseInput = () => {
    const allowlist_path = core.getInput('allowlist_path', {
        required: true,
        trimWhitespace: true
    })
    const allowlist_repo = core.getInput('allowlist_path', {
        required: true,
        trimWhitespace: true
    })
    const org = core.getInput('org', {
        required: true,
        trimWhitespace: true
    })
    const repo = core.getInput('repo', {
        required: true,
        trimWhitespace: true
    })
    const token = core.getInput('token', {
        required: true,
        trimWhitespace: true
    })

    return {
        allowlist_path: allowlist_path,
        allowlist_repo: allowlist_repo,
        org: org,
        repo: repo.toLowerCase(),
        token: token
    }
}

const getFileArray = async (octokit, owner, repo, path) => {
    try {
        const {data: response} = await octokit.repos.getContent({
            owner: owner,
            repo: repo,
            path: path
        })
        const content = Buffer.from(response.content, 'base64').toString().trim()

        return content.split('\n').filter(line => !line.includes('#'))
    } catch (e) {
        if (e.status === 404) {
            return null
        }
        throw new Error(`failed retrieving ${path} for ${owner}/${repo}: ${e.message}`)
    }
}

main().catch(e => {
    core.setFailed(`Failed to bundle and upload database: ${e.message}`)
})
