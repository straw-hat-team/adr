adr_id() {
  local result=$(npx nanoid-cli --size 10 --alphabet "0123456789")
  echo $result
}

main() {
  dir_name=$(adr_id)
  template=./templates/adr.md
  output=./adrs/$dir_name/README.md

  echo "creating directory ./adrs/$dir_name/"
  mkdir ./adrs/$dir_name/

  echo "copy $template template into $output"
  cp $template $output
}

main
