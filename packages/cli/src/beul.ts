#!/usr/bin/env node
import chalk from 'chalk'

import { input } from '@inquirer/prompts'
import { Command } from 'commander'

import fs from 'fs/promises'
import path from 'path'
import { exit } from 'process'

import pkg from '../package.json' with { type: 'json' }
import { build } from '@beul-ssg/core'

const VERSION = pkg.version
const program = new Command()

const CLI_ROOT = path.resolve(import.meta.dirname, '../')
const TEMPLATE_DIR = path.join(CLI_ROOT, 'template')

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'
type BuildOptions = {
  root?: string
  outDir?: string
  config?: string
}

// pnpm create, npx 등으로 실행 시 pkg manager 감지
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

type BeulInitOption = {
  root?: string
}

program
  .command('init')
  .description('Create a new Beul project')
  .argument('[project-name]', 'Name of the new Beul project')
  .option('--root <dir>', 'Project root directory')
  .action(async (projectName?: string, options?: BeulInitOption) => {
    try {
      if (options?.root) {
        const targetDir = path.resolve(options.root)
        try {
          await fs.access(targetDir)
          console.log(chalk.red(`\n❌ The directory "${targetDir}" already exists. Please choose a different name or remove the existing directory.`))
          exit(1)
        } catch { }
        await fs.mkdir(targetDir, { recursive: true })
        process.chdir(targetDir)
      }

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

program
  .command('dev')
  .description('TBD')

program
  .command('build')
  .description('Build a Beul project')
  .option('--root <dir>', 'Project root directory')
  .option('--outDir <dir>', 'Output directory (default: dist)')
  .option('--config <dir>', 'Config file path (default: beul.config.ts)')
  .action(async (options?: BuildOptions) => {
    const originalCwd = process.cwd()
    const targetRoot = path.resolve(options?.root ?? originalCwd)
    const buildParams: Parameters<typeof build>[0] = {}

    if (options?.config !== undefined) buildParams.configPath = options.config
    if (options?.outDir !== undefined) buildParams.overwrites = { outDir: options.outDir }

    await build(buildParams)

    console.log(chalk.bold('🛠️  Building the Beul project...\n'))
    console.log(chalk.dim(`  Project Root: ${targetRoot}\n`))

    try {
      await fs.access(targetRoot)
      process.chdir(targetRoot)
      await build(buildParams)
    } finally {
      process.chdir(originalCwd)
    }
  })

await program.parseAsync(process.argv)
