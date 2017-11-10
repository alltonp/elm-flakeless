module Driveby.Runner.Model exposing (..)

import Date exposing (..)
import Dict exposing (..)
import Driveby exposing (..)
import Driveby.Model exposing (..)
import Fifo exposing (..)


type alias Flags =
    { numberOfBrowsers : Int }


type alias Model =
    { flags : Flags
    , queue : Fifo ICommand
    }


type alias ICommand =
    { js : String
    }


type alias Context =
    {}


type Msg
    = Go Date
    | Process Response
