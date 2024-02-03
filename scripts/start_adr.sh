adr_id() {
  local result=$(npx nanoid-cli --size 10 --alphabet "0123456789")
  echo $result
}

main() {
  dir_name=$(adr_id)
  template=./templates/adr.md
  output=./src/adrs/$dir_name/README.md

  echo "creating directory ./src/adrs/$dir_name/"
  mkdir ./src/adrs/$dir_name/

  echo "copy $template template into $output"
  cp $template $output

  sed -i '' "s/<!-- ADR unique identifier -->/$dir_name/g" $output
  sed -i '' "s/<!-- YYYY-MM-DD -->/$(date +'%Y-%m-%d')/g" $output
  echo "ADR created at $output"
}

main
