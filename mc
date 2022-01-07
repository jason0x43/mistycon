#!/bin/zsh

if (( $+commands[deno] )); then
	DENO_BIN=$(which deno)
else
	# Use a local copy of deno, downloading if necessary
	if [[ ! -d $PWD/.deno ]]; then
		curl -fsSL https://deno.land/x/install/install.sh | DENO_INSTALL=$PWD/.deno sh
	fi
	DENO_BIN=$PWD/.deno/bin/deno
fi

$DENO_BIN run --allow-net --allow-read --allow-write cli.ts $@
