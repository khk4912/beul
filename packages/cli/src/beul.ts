#!/usr/bin/env node

import fs from 'fs/promises'
import { input } from '@inquirer/prompts'
import { Command } from 'commander'
import chalk from 'chalk'
import path from 'path'
import pkg from '../package.json' with { type: 'json'}
import { exit } from 'process'

const VERSION = pkg.version
const program = new Command()

const PACKAGE_ROOT = path.resolve(import.meta.dirname, '../../')
const TEMPLATE_DIR = path.join(PACKAGE_ROOT, 'template')

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'
function getUserAgent (): PackageManager {
  const userAgent = process.env.npm_config_user_agent
  if (!userAgent) return 'npm' // 실패 시 npm

  if (userAgent.startsWith('yarn')) return 'yarn'
  if (userAgent.startsWith('pnpm')) return 'pnpm'
  if (userAgent.startsWith('bun')) return 'bun'

  return 'npm' // 위에 없어도 npm
}

program
  .name('beul')
  .description('Beul CLI')
  .version(VERSION)

program
  .command('init')
  .description('Create a new Beul project')
  .argument('[project-name]', 'Name of the new Beul project')
  .action(async (projectName?: string) => {
    try {
      console.log(chalk.bold(`📝 Beul 블 v${VERSION}\n`))

      const name = projectName ??
        await input(
          {
            message: 'Project Name:',
            default: 'my-beul-blog',
            validate: (value) => {
              if (!value || value.trim() === '') {
                return 'Project name cannot be empty.'
              }
              return true
            }
          }
        )

      try {
        await fs.access(name)
        console.log(chalk.red(`\n❌ A directory named "${name}" already exists. Please choose a different name or remove the existing directory.`))
        exit(1)
      } catch { }

      console.log(chalk.green(`\n🚀 Creating a new Beul project in ${chalk.bold(name)}...`))
      await fs.cp(TEMPLATE_DIR, name, { recursive: true })

      const pm = getUserAgent()
      const runCommand = pm === 'npm' ? 'npm run' : pm

      console.log(chalk.cyan('\n✨ Project created successfully!'))
      console.log('\nNext steps:\n')

      console.log(chalk.dim(`  cd ${name}`))

      console.log(chalk.dim(`  ${pm} install`))
      console.log(chalk.dim(`  ${runCommand} dev\n`))
    } catch (error) {
      if (error instanceof Error && error.name === 'ExitPromptError') { return undefined } else { throw error }
    }
  })

await program.parseAsync(process.argv)
