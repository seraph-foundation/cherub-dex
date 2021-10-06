ship:
	@ANCHOR_PROVIDER_URL="http://127.0.0.1:8899" ANCHOR_WALLET="~/.config/solana/id.json" anchor build
	@ANCHOR_PROVIDER_URL="http://127.0.0.1:8899" ANCHOR_WALLET="~/.config/solana/id.json" anchor deploy
	@ANCHOR_PROVIDER_URL="http://127.0.0.1:8899" ANCHOR_WALLET="~/.config/solana/id.json" mocha -t 1000000 tests/

mocha-localnet:
	@ANCHOR_PROVIDER_URL="http://127.0.0.1:8899" ANCHOR_WALLET="~/.config/solana/id.json" mocha -t 1000000 tests/

mocha-devnet:
	@ANCHOR_PROVIDER_URL="https://api.devnet.solana.com" ANCHOR_WALLET="~/.config/solana/id.json" mocha -t 1000000 tests/

test:
	@anchor --provider.cluster http://127.0.0.1:8899 build
	@anchor --provider.cluster http://127.0.0.1:8899 deploy
	@anchor --provider.cluster http://127.0.0.1:8899 test --skip-local-validator --skip-deploy --skip-build

test-skip:
	@anchor test --skip-local-validator --skip-deploy --skip-build

test-validator:
	@solana-test-validator \
		--bpf-program FyuPaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS ./target/deploy/factory.so \
		--bpf-program Fx9PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS ./target/deploy/exchange.so \
		--bpf-program Fz9PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS ./target/deploy/pyth.so

set-devnet:
	@solana config set --url https://api.devnet.solana.com

set-localnet:
	@solana config set --url http://127.0.0.1:8899

validator:
	@solana-validator \
		--identity validator-keypair.json \
		--vote-account vote-account-keypair.json \
		--known-validator dv1ZAGvdsz5hHLwWXsVnM94hWf1pjbKVau1QVkaMJ92 \
		--known-validator dv2eQHeP4RFrJZ6UeiZWoc3XTtmtZCUKxxCApCDcRNV \
		--known-validator dv4ACNkpYPcE3aKmYDqZm9G5EB3J4MRoeE7WNDRBVJB \
		--known-validator dv3qDFk1DTF36Z62bNvrCXe9sKATA6xvVy6A798xxAS \
		--only-known-rpc \
		--ledger ledger \
		--rpc-port 8899 \
		--dynamic-port-range 8000-8010 \
		--entrypoint entrypoint.devnet.solana.com:8001 \
		--entrypoint entrypoint2.devnet.solana.com:8001 \
		--entrypoint entrypoint3.devnet.solana.com:8001 \
		--entrypoint entrypoint4.devnet.solana.com:8001 \
		--entrypoint entrypoint5.devnet.solana.com:8001 \
		--expected-genesis-hash EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG \
		--wal-recovery-mode skip_any_corrupted_record \
		--limit-ledger-size

airdrop-wallet:
	@while true; do solana airdrop 1 7ADLt8RQX6W5v7L4voBxY9WcT7xRVis9rgbaUTpvEQ4w; sleep 30; done

airdrop:
	@while true; do solana airdrop 1; sleep 30; done

copy-idl:
	@node copyIdl.js
