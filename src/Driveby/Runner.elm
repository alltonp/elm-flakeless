module Driveby.Runner exposing (run)

import Date exposing (..)
import Dict exposing (..)
import Driveby exposing (..)
import Driveby.Model exposing (..)
import Driveby.Runner.Model exposing (..)
import Fifo exposing (..)
import Html exposing (..)
import Maybe.Extra as MaybeExtra
import Task


run : Suite -> (Request -> Cmd Msg) -> ((Response -> Msg) -> Sub Msg) -> Program Flags Model Msg
run suite requestsPort responsesPort =
    Html.programWithFlags
        { init = init
        , view = view
        , update = update requestsPort
        , subscriptions = subscriptions responsesPort
        }


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( Model flags (Fifo.fromList [ ICommand "console.log('hi')", ICommand "console.log('hi')" ]), go )


go : Cmd Msg
go =
    Task.perform
        Go
        Date.now


subscriptions : ((Response -> Msg) -> Sub Msg) -> Model -> Sub Msg
subscriptions responsesPort model =
    responsesPort Process


update : (Request -> Cmd Msg) -> Msg -> Model -> ( Model, Cmd Msg )
update requestsPort msg model =
    case msg of
        Go x ->
            let
                ( maybeCommand, queue_ ) =
                    Fifo.remove model.queue
            in
            ( { model | queue = queue_ }, Cmd.none )

        _ ->
            ( model, Cmd.none )


view : Model -> Html Msg
view model =
    div [] []
