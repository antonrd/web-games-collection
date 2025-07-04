// --- Game Data ---
const levels = [
  {
      name: "Intro 1: First Steps", // 1 box, 1 target
      layout: [
          "#####",
          "#@$.#",
          "#####"
      ]
  },
  {
      name: "Intro 2: Simple Push", // 2 boxes, 2 targets
      layout: [
          "#####",
          "#@$.#",
          "# $.#",
          "#####"
      ]
  },
  {
      name: "Level 1",
      layout: [
      "    #####",
      "    #   #",
      "    #$  #",
      "  ###  $##",
      "  #  $ $ #",
      "### # ## #   ######",
      "#   # ## #####  ..#",
      "# $  $          ..#",
      "##### ### #@##  ..#",
      "    #     #########",
      "    ####### "
      ]
  },
  {
      name: "Level 2",
      layout: [
      "############",
      "#..  #     ###",
      "#..  # $  $  #",
      "#..  #$####  #",
      "#..    @ ##  #",
      "#..  # #  $ ##",
      "###### ##$ $ #",
      "  # $  $ $ $ #",
      "  #    #     #",
      "  ############ "
      ]
  },
  {
      name: "Level 3",
      layout: [
      "        ########",
      "        #     @#",
      "        # $#$ ##",
      "        # $  $#",
      "        ##$ $ #",
      "######### $ # ###",
      "#....  ## $  $  #",
      "##...    $  $   #",
      "#....  ##########",
      "######## "
      ]
  },
  {
      name: "Level 4",
      layout: [
      "           ########",
      "           #  ....#",
      "############  ....#",
      "#    #  $ $   ....#",
      "# $$$#$  $ #  ....#",
      "#  $     $ #  ....#",
      "# $$ #$ $ $########",
      "#  $ #     #",
      "## #########",
      "#    #    ##",
      "#     $   ##",
      "#  $$#$$  @#",
      "#    #    ##",
      "########### "
      ]
  },
  {
      name: "Level 5",
      layout: [
      "        #####",
      "        #   #####",
      "        # #$##  #",
      "        #     $ #",
      "######### ###   #",
      "#....  ## $  $###",
      "#....    $ $$ ##",
      "#....  ##$  $ @#",
      "#########  $  ##",
      "        # $ $  #",
      "        ### ## #",
      "          #    #",
      "          ###### "
      ]
  },
  {
      name: "Level 6",
      layout: [
      "######  ###",
      "#..  # ##@##",
      "#..  ###   #",
      "#..     $$ #",
      "#..  # # $ #",
      "#..### # $ #",
      "#### $ #$  #",
      "   #  $# $ #",
      "   # $  $  #",
      "   #  ##   #",
      "   ######### "
      ]
  },
  {
      name: "Level 7",
      layout: [
      "       #####",
      " #######   ##",
      "## # @## $$ #",
      "#    $      #",
      "#  $  ###   #",
      "### #####$###",
      "# $  ### ..#",
      "# $ $ $ ...#",
      "#    ###...#",
      "# $$ # #...#",
      "#  ### #####",
      "#### "
      ]
  },
  {
      name: "Level 8",
      layout: [
      "  ####",
      "  #  ###########",
      "  #    $   $ $ #",
      "  # $# $ #  $  #",
      "  #  $ $  #    #",
      "### $# #  #### #",
      "#@#$ $ $  ##   #",
      "#    $ #$#   # #",
      "#   $    $ $ $ #",
      "#####  #########",
      "  #      #",
      "  #      #",
      "  #......#",
      "  #......#",
      "  #......#",
      "  ######## "
      ]
  },
  {
      name: "Level 9",
      layout: [
      "          #######",
      "          #  ...#",
      "      #####  ...#",
      "      #      . .#",
      "      #  ##  ...#",
      "      ## ##  ...#",
      "     ### ########",
      "     # $$$ ##",
      " #####  $ $ #####",
      "##   #$ $   #   #",
      "#@ $  $    $  $ #",
      "###### $$ $ #####",
      "     #      #",
      "     ######## "
      ]
  },
  {
      name: "Level 10",
      layout: [
      " ###  #############",
      "##@####       #   #",
      "# $$   $$  $ $ ...#",
      "#  $$$#    $  #...#",
      "# $   # $$ $$ #...#",
      "###   #  $    #...#",
      "#     # $ $ $ #...#",
      "#    ###### ###...#",
      "## #  #  $ $  #...#",
      "#  ## # $$ $ $##..#",
      "# ..# #  $      #.#",
      "# ..# # $$$ $$$ #.#",
      "##### #       # #.#",
      "    # ######### #.#",
      "    #           #.#",
      "    ############### "
      ]
  },
  {
      name: "Level 11",
      layout: [
      "          ####",
      "     #### #  #",
      "   ### @###$ #",
      "  ##      $  #",
      " ##  $ $$## ##",
      " #  #$##     #",
      " # # $ $$ # ###",
      " #   $ #  # $ #####",
      "####    #  $$ #   #",
      "#### ## $         #",
      "#.    ###  ########",
      "#.. ..# ####",
      "#...#.#",
      "#.....#",
      "####### "
      ]
  },
  {
      name: "Level 12",
      layout: [
      "################",
      "#              #",
      "# # ######     #",
      "# #  $ $ $ $#  #",
      "# #   $@$   ## ##",
      "# #  $ $ $###...#",
      "# #   $ $  ##...#",
      "# ###$$$ $ ##...#",
      "#     # ## ##...#",
      "#####   ## ##...#",
      "    #####     ###",
      "        #     #",
      "        ####### "
      ]
  },
  {
      name: "Level 13",
      layout: [
      "   #########",
      "  ##   ##  ######",
      "###     #  #    ###",
      "#  $ #$ #  #  ... #",
      "# # $#@$## # #.#. #",
      "#  # #$  #    . . #",
      "# $    $ # # #.#. #",
      "#   ##  ##$ $ . . #",
      "# $ #   #  #$#.#. #",
      "## $  $   $  $... #",
      " #$ ######    ##  #",
      " #  #    ##########",
      " #### "
      ]
  },
  {
      name: "Level 14",
      layout: [
      "       #######",
      " #######     #",
      " #     # $@$ #",
      " #$$ #   #########",
      " # ###......##   #",
      " #   $......## # #",
      " # ###......     #",
      "##   #### ### #$##",
      "#  #$   #  $  # #",
      "#  $ $$$  # $## #",
      "#   $ $ ###$$ # #",
      "#####     $   # #",
      "    ### ###   # #",
      "      #     #   #",
      "      ########  #",
      "             #### "
      ]
  },
  {
      name: "Level 15",
      layout: [
      "   ########",
      "   #   #  #",
      "   #  $   #",
      " ### #$   ####",
      " #  $  ##$   #",
      " #  # @ $ # $#",
      " #  #      $ ####",
      " ## ####$##     #",
      " # $#.....# #   #",
      " #  $..**. $# ###",
      "##  #.....#   #",
      "#   ### #######",
      "# $$  #  #",
      "#  #     #",
      "######   #",
      "     ##### "
      ]
  },
  {
      name: "Level 16",
      layout: [
      "#####",
      "#   ##",
      "#    #  ####",
      "# $  ####  #",
      "#  $$ $   $#",
      "###@ #$    ##",
      " #  ##  $ $ ##",
      " # $  ## ## .#",
      " #  #$##$  #.#",
      " ###   $..##.#",
      "  #    #.*...#",
      "  # $$ #.....#",
      "  #  #########",
      "  #  #",
      "  #### "
      ]
  },
  {
      name: "Level 17",
      layout: [
      "   ##########",
      "   #..  #   #",
      "   #..      #",
      "   #..  #  ####",
      "  #######  #  ##",
      "  #            #",
      "  #  #  ##  #  #",
      "#### ##  #### ##",
      "#  $  ##### #  #",
      "# # $  $  # $  #",
      "# @$  $   #   ##",
      "#### ## #######",
      "   #    #",
      "   ###### "
      ]
  },
  {
      name: "Level 18",
      layout: [
      "     ###########",
      "     #  .  #   #",
      "     # #.    @ #",
      " ##### ##..# ####",
      "##  # ..###     ###",
      "# $ #...   $ #  $ #",
      "#    .. ##  ## ## #",
      "####$##$# $ #   # #",
      "  ## #    #$ $$ # #",
      "  #  $ # #  # $## #",
      "  #               #",
      "  #  ###########  #",
      "  ####         #### "
      ]
  },
  {
      name: "Level 19",
      layout: [
      "  ######",
      "  #   @####",
      "##### $   #",
      "#   ##    ####",
      "# $ #  ##    #",
      "# $ #  ##### #",
      "## $  $    # #",
      " # $ $ ### # #",
      " # #  $  # # #",
      " # # #$#   # #",
      "## ###   # # ######",
      "#  $  #### # #....#",
      "#    $    $   ..#.#",
      "####$  $# $   ....#",
      "#       #  ## ....#",
      "################### "
      ]
  },
  {
      name: "Level 20",
      layout: [
      "    ##########",
      "#####        ####",
      "#     #   $  #@ #",
      "# #######$####  ###",
      "# #    ## #  #$ ..#",
      "# # $     #  #  #.#",
      "# # $  #     #$ ..#",
      "# #  ### ##     #.#",
      "# ###  #  #  #$ ..#",
      "# #    #  ####  #.#",
      "# #$   $  $  #$ ..#",
      "#    $ # $ $ #  #.#",
      "#### $###    #$ ..#",
      "   #    $$ ###....#",
      "   #      ## ######",
      "   ######## "
      ]
  },
  {
      name: "Level 21",
      layout: [
      "#########",
      "#       #",
      "#       ####",
      "## #### #  #",
      "## #@##    #",
      "# $$$ $  $$#",
      "#  # ## $  #",
      "#  # ##  $ ####",
      "####  $$$ $#  #",
      " #   ##   ....#",
      " # #   # #.. .#",
      " #   # # ##...#",
      " ##### $  #...#",
      "     ##   #####",
      "      ##### "
      ]
  },
  {
      name: "Level 22",
      layout: [
      "######     ####",
      "#    #######  #####",
      "#   $#  #  $  #   #",
      "#  $  $  $ # $ $  #",
      "##$ $   # @# $    #",
      "#  $ ########### ##",
      "# #   #.......# $#",
      "# ##  # ......#  #",
      "# #   $........$ #",
      "# # $ #.... ..#  #",
      "#  $ $####$#### $#",
      "# $   ### $   $  ##",
      "# $     $ $  $    #",
      "## ###### $ ##### #",
      "#         #       #",
      "################### "
      ]
  },
  {
      name: "Level 23",
      layout: [
      "    #######",
      "    #  #  ####",
      "##### $#$ #  ##",
      "#.. #  #  #   #",
      "#.. # $#$ #  $####",
      "#.  #     #$  #  #",
      "#..   $#  # $    #",
      "#..@#  #$ #$  #  #",
      "#.. # $#     $#  #",
      "#.. #  #$$#$  #  ##",
      "#.. # $#  #  $#$  #",
      "#.. #  #  #   #   #",
      "##. ####  #####   #",
      " ####  ####   ##### "
      ]
  },
  {
      name: "Level 24",
      layout: [
      "###############",
      "#..........  .####",
      "#..........$$.#  #",
      "###########$ #   ##",
      "#      $  $     $ #",
      "## ####   #  $ #  #",
      "#      #   ##  # ##",
      "#  $#  # ##  ### ##",
      "# $ #$###    ### ##",
      "###  $ #  #  ### ##",
      "###    $ ## #  # ##",
      " # $  #  $  $ $   #",
      " #  $  $#$$$  #   #",
      " #  #  $      #####",
      " # @##  #  #  #",
      " ############## "
      ]
  },
  {
      name: "Level 25",
      layout: [
      "####",
      "#  ##############",
      "#  #   ..#......#",
      "#  # # ##### ...#",
      "##$#    ........#",
      "#   ##$######  ####",
      "# $ #     ######@ #",
      "##$ # $   ######  #",
      "#  $ #$$$##       #",
      "#      #    #$#$###",
      "# #### #$$$$$    #",
      "# #    $     #   #",
      "# #   ##        ###",
      "# ######$###### $ #",
      "#        #    #   #",
      "##########    ##### "
      ]
  },
  {
      name: "Level 26",
      layout: [
      " #######",
      " #  #  #####",
      "##  #  #...###",
      "#  $#  #...  #",
      "# $ #$$ ...  #",
      "#  $#  #... .#",
      "#   # $########",
      "##$       $ $ #",
      "##  #  $$ #   #",
      " ######  ##$$@#",
      "      #      ##",
      "      ######## "
      ]
  },
  {
      name: "Level 27",
      layout: [
      " #################",
      " #...   #    #   ##",
      "##.....  $## # #$ #",
      "#......#  $  #    #",
      "#......#  #  # #  #",
      "######### $  $ $  #",
      "  #     #$##$ ##$##",
      " ##   $    # $    #",
      " #  ## ### #  ##$ #",
      " # $ $$     $  $  #",
      " # $    $##$ ######",
      " #######  @ ##",
      "       ###### "
      ]
  },
  {
      name: "Level 28",
      layout: [
      "         #####",
      "     #####   #",
      "    ## $  $  ####",
      "##### $  $ $ ##.#",
      "#       $$  ##..#",
      "#  ###### ###.. #",
      "## #  #    #... #",
      "# $   #    #... #",
      "#@ #$ ## ####...#",
      "####  $ $$  ##..#",
      "   ##  $ $  $...#",
      "    # $$  $ #  .#",
      "    #   $ $  ####",
      "    ######   #",
      "         ##### "
      ]
  },
  {
      name: "Level 29",
      layout: [
      "#####",
      "#   ##",
      "# $  #########",
      "## # #       ######",
      "## #   $#$#@  #   #",
      "#  #      $ #   $ #",
      "#  ### ######### ##",
      "#  ## ..*..... # ##",
      "## ## *.*..*.* # ##",
      "# $########## ##$ #",
      "#  $   $  $    $  #",
      "#  #   #   #   #  #",
      "################### "
      ]
  },
  {
      name: "Level 30",
      layout: [
      "       ###########",
      "       #   #     #",
      "#####  #     $ $ #",
      "#   ##### $## # ##",
      "# $ ##   # ## $  #",
      "# $  @$$ # ##$$$ #",
      "## ###   # ##    #",
      "## #   ### #####$#",
      "## #     $  #....#",
      "#  ### ## $ #....##",
      "# $   $ #   #..$. #",
      "#  ## $ #  ##.... #",
      "#####   ######...##",
      "    #####    ##### "
      ]
  },
  {
      name: "Level 31",
      layout: [
      "  ####",
      "  #  #########",
      " ##  ##  #   #",
      " #  $# $@$   ####",
      " #$  $  # $ $#  ##",
      "##  $## #$ $     #",
      "#  #  # #   $$$  #",
      "# $    $  $## ####",
      "# $ $ #$#  #  #",
      "##  ###  ###$ #",
      " #  #....     #",
      " ####......####",
      "   #....####",
      "   #...##",
      "   #...#",
      "   ##### "
      ]
  },
  {
      name: "Level 32",
      layout: [
      "      ####",
      "  #####  #",
      " ##     $#",
      "## $  ## ###",
      "#@$ $ # $  #",
      "#### ##   $#",
      " #....#$ $ #",
      " #....#   $#",
      " #....  $$ ##",
      " #... # $   #",
      " ######$ $  #",
      "      #   ###",
      "      #$ ###",
      "      #  #",
      "      #### "
      ]
  },
  {
      name: "Level 33",
      layout: [
      "############",
      "##     ##  #",
      "##   $   $ #",
      "#### ## $$ #",
      "#   $ #    #",
      "# $$$ # ####",
      "#   # # $ ##",
      "#  #  #  $ #",
      "# $# $#    #",
      "#   ..# ####",
      "####.. $ #@#",
      "#.....# $# #",
      "##....#  $ #",
      "###..##    #",
      "############ "
      ]
  },
  {
      name: "Level 34",
      layout: [
      " #########",
      " #....   ##",
      " #.#.#  $ ##",
      "##....# # @##",
      "# ....#  #  ##",
      "#     #$ ##$ #",
      "## ###  $    #",
      " #$  $ $ $#  #",
      " # #  $ $ ## #",
      " #  ###  ##  #",
      " #    ## ## ##",
      " #  $ #  $  #",
      " ###$ $   ###",
      "   #  #####",
      "   #### "
      ]
  },
  {
      name: "Level 35",
      layout: [
      "############ ######",
      "#   #    # ###....#",
      "#   $$#   @  .....#",
      "#   # ###   # ....#",
      "## ## ###  #  ....#",
      " # $ $     # # ####",
      " #  $ $##  #      #",
      "#### #  #### # ## #",
      "#  # #$   ## #    #",
      "# $  $  # ## #   ##",
      "# # $ $    # #   #",
      "#  $ ## ## # #####",
      "# $$     $$  #",
      "## ## ### $  #",
      " #    # #    #",
      " ###### ###### "
      ]
  },
  {
      name: "Level 36",
      layout: [
      "            #####",
      "#####  ######   #",
      "#   ####  $ $ $ #",
      "# $   ## ## ##  ##",
      "#   $ $     $  $ #",
      "### $  ## ##     ##",
      "  # ##### #####$$ #",
      " ##$##### @##     #",
      " # $  ###$### $  ##",
      " # $  #   ###  ###",
      " # $$ $ #   $$ #",
      " #     #   ##  #",
      " #######.. .###",
      "    #.........#",
      "    #.........#",
      "    ########### "
      ]
  },
  {
      name: "Level 37",
      layout: [
      "###########",
      "#......   #########",
      "#......   #  ##   #",
      "#..### $    $     #",
      "#... $ $ #   ##   #",
      "#...#$#####    #  #",
      "###    #   #$  #$ #",
      "  #  $$ $ $  $##  #",
      "  #  $   #$#$ ##$ #",
      "  ### ## #    ##  #",
      "   #  $ $ ## ######",
      "   #    $  $  #",
      "   ##   # #   #",
      "    #####@#####",
      "        ### "
      ]
  },
  {
      name: "Level 38",
      layout: [
      "      ####",
      "####### @#",
      "#     $  #",
      "#   $## $#",
      "##$#...# #",
      " # $...  #",
      " # #. .# ##",
      " #   # #$ #",
      " #$  $    #",
      " #  #######",
      " #### "
      ]
  },
  {
      name: "Level 39",
      layout: [
      "             ######",
      " #############....#",
      "##   ##     ##....#",
      "#  $$##  $ @##....#",
      "#      $$ $#  ....#",
      "#  $ ## $$ # # ...#",
      "#  $ ## $  #  ....#",
      "## ##### ### ##.###",
      "##   $  $ ##   .  #",
      "# $###  # ##### ###",
      "#   $   #       #",
      "#  $ #$ $ $###  #",
      "# $$$# $   # ####",
      "#    #  $$ #",
      "######   ###",
      "     ##### "
      ]
  },
  {
      name: "Level 40",
      layout: [
      "    ############",
      "    #          ##",
      "    #  # #$$ $  #",
      "    #$ #$#  ## @#",
      "   ## ## # $ # ##",
      "   #   $ #$  # #",
      "   #   # $   # #",
      "   ## $ $   ## #",
      "   #  #  ##  $ #",
      "   #    ## $$# #",
      "######$$   #   #",
      "#....#  ########",
      "#.#... ##",
      "#....   #",
      "#....   #",
      "######### "
      ]
  },
  {
      name: "Level 41",
      layout: [
      "           #####",
      "          ##   ##",
      "         ##     #",
      "        ##  $$  #",
      "       ## $$  $ #",
      "       # $    $ #",
      "####   #   $$ #####",
      "#  ######## ##    #",
      "#.            $$$@#",
      "#.# ####### ##   ##",
      "#.# #######. #$ $##",
      "#........... #    #",
      "##############  $ #",
      "             ##  ##",
      "              #### "
      ]
  },
  {
      name: "Level 42",
      layout: [
      "     ########",
      "  ####      ######",
      "  #    ## $ $   @#",
      "  # ## ##$#$ $ $##",
      "### ......#  $$ ##",
      "#   ......#  #   #",
      "# # ......#$  $  #",
      "# #$...... $$# $ #",
      "#   ### ###$  $ ##",
      "###  $  $  $  $ #",
      "  #  $  $  $  $ #",
      "  ######   ######",
      "       ##### "
      ]
  },
  {
      name: "Level 43",
      layout: [
      "        #######",
      "    #####  #  ####",
      "    #   #   $    #",
      " #### #$$ ## ##  #",
      "##      # #  ## ###",
      "#  ### $#$  $  $  #",
      "#...    # ##  #   #",
      "#...#    @ # ### ##",
      "#...#  ###  $  $  #",
      "######## ##   #   #",
      "          ######### "
      ]
  },
  {
      name: "Level 44",
      layout: [
      " #####",
      " #   #",
      " # # #######",
      " #      $@######",
      " # $ ##$ ###   #",
      " # #### $    $ #",
      " # ##### #  #$ ####",
      "##  #### ##$      #",
      "#  $#  $  # ## ## #",
      "#         # #...# #",
      "######  ###  ...  #",
      "     #### # #...# #",
      "          # ### # #",
      "          #       #",
      "          ######### "
      ]
  },
  {
      name: "Level 45",
      layout: [
      "##### ####",
      "#...# #  ####",
      "#...###  $  #",
      "#....## $  $###",
      "##....##   $  #",
      "###... ## $ $ #",
      "# ##    #  $  #",
      "#  ## # ### ####",
      "# $ # #$  $    #",
      "#  $ @ $    $  #",
      "#   # $ $$ $ ###",
      "#  ######  ###",
      "# ##    ####",
      "### "
      ]
  },
  {
      name: "Level 46",
      layout: [
      "##########",
      "#        ####",
      "# ###### #  ##",
      "# # $ $ $  $ #",
      "#       #$   #",
      "###$  $$#  ###",
      "  #  ## # $##",
      "  ##$#   $ @#",
      "   #  $ $ ###",
      "   # #   $  #",
      "   # ##   # #",
      "  ##  ##### #",
      "  #         #",
      "  #.......###",
      "  #.......#",
      "  ######### "
      ]
  },
  {
      name: "Level 47",
      layout: [
      "         ####",
      " #########  ##",
      "##  $      $ #####",
      "#   ## ##   ##...#",
      "# #$$ $ $$#$##...#",
      "# #   @   #   ...#",
      "#  $# ###$$   ...#",
      "# $  $$  $ ##....#",
      "###$       #######",
      "  #  #######",
      "  #### "
      ]
  },
  {
      name: "Level 48",
      layout: [
      "  #########",
      "  #*.*#*.*#",
      "  #.*.*.*.#",
      "  #*.*.*.*#",
      "  #.*.*.*.#",
      "  #*.*.*.*#",
      "  ###   ###",
      "    #   #",
      "###### ######",
      "#           #",
      "# $ $ $ $ $ #",
      "## $ $ $ $ ##",
      " #$ $ $ $ $#",
      " #   $@$   #",
      " #  #####  #",
      " ####   #### "
      ]
  },
  {
      name: "Level 49",
      layout: [
      "       ####",
      "       #  ##",
      "       #   ##",
      "       # $$ ##",
      "     ###$  $ ##",
      "  ####    $   #",
      "###  # #####  #",
      "#    # #....$ #",
      "# #   $ ....# #",
      "#  $ # #.*..# #",
      "###  #### ### #",
      "  #### @$  ##$##",
      "     ### $     #",
      "       #  ##   #",
      "       ######### "
      ]
  },
  {
      name: "Level 50",
      layout: [
      "      ############",
      "     ##..    #   #",
      "    ##..* $    $ #",
      "   ##..*.# # # $##",
      "   #..*.# # # $  #",
      "####...#  #    # #",
      "#  ## #          #",
      "# @$ $ ###  #   ##",
      "# $   $   # #   #",
      "###$$   # # # # #",
      "  #   $   # # #####",
      "  # $# #####      #",
      "  #$   #   #    # #",
      "  #  ###   ##     #",
      "  #  #      #    ##",
      "  ####      ###### "
      ]
  },
];
